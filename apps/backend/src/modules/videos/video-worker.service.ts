import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { unlinkSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { Video } from "@/generated/prisma/client";
import { VideoStorageService } from "./video-storage.service";
import {
  InvalidVideoError,
  VideoTranscoderService,
} from "./video-transcoder.service";
import {
  VIDEO_JOB_DIRECTORY,
  VIDEO_JOB_TIMEOUT_MS,
  VIDEO_TRANSACTION_TIMEOUT_MS,
  VIDEO_UPLOAD_DIRECTORY,
  VIDEO_WORKER_LOCK,
} from "./videos.constants";

@Injectable()
export class VideoWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VideoWorkerService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;
  private stopping = false;
  private readonly shutdown = new AbortController();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: VideoStorageService,
    private readonly transcoder: VideoTranscoderService,
  ) {}

  onModuleInit(): void {
    if (!this.storage.enabled) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, 5000);
    this.timer.unref();
    void this.tick();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    this.shutdown.abort();
    await this.running;
  }

  /** Local guard plus a PostgreSQL lock: one encoder across backend replicas. */
  async tick(): Promise<void> {
    if (this.running || this.stopping || !this.storage.enabled) return;
    this.running = this.runLocked().catch(() => {
      this.logger.error(
        "Video worker interrupted; unfinished jobs will be recovered",
      );
    });
    try {
      await this.running;
    } finally {
      this.running = undefined;
    }
  }

  private async runLocked(): Promise<void> {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, this.shutdown.signal]);
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const [lock] = await tx.$queryRaw<{ acquired: boolean }[]>`
          SELECT pg_try_advisory_xact_lock(${VIDEO_WORKER_LOCK}) AS acquired
        `;
          if (!lock?.acquired) return;
          // Expire work BEFORE Prisma's transaction timeout can release its lock.
          const deadline = setTimeout(
            () => controller.abort(),
            VIDEO_JOB_TIMEOUT_MS,
          );
          let heartbeat: Promise<void> | undefined;
          const timer = setInterval(() => {
            if (heartbeat) return;
            heartbeat = tx.$queryRaw`SELECT 1`
              .then(() => undefined)
              .catch(() => {
                controller.abort();
              })
              .finally(() => {
                heartbeat = undefined;
              });
          }, 1000);
          try {
            // Status writes intentionally use the main client: they must be visible
            // while this separate transaction holds only the encoder lock.
            await this.work(signal);
          } finally {
            clearTimeout(deadline);
            clearInterval(timer);
            await heartbeat;
          }
        },
        { timeout: VIDEO_TRANSACTION_TIMEOUT_MS, maxWait: 2000 },
      );
    } finally {
      controller.abort();
    }
  }

  private async work(signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    // Acquiring the global lock proves no healthy worker still owns these jobs.
    await this.prisma.video.updateMany({
      where: { status: "processing" },
      data: { status: "pending" },
    });
    await this.prisma.video.updateMany({
      where: {
        status: "uploading",
        updatedAt: { lt: new Date(Date.now() - 10 * 60_000) },
      },
      data: { status: "failed", error: "uploadFailed" },
    });
    await this.prisma.video.updateMany({
      where: {
        status: { not: "uploading" },
        OR: [{ dogId: null }, { exerciseId: null }],
      },
      data: { status: "deleting" },
    });
    await this.cleanupTemporaryFiles();
    // Retry storage cleanup on subsequent ticks if the provider is unavailable.
    const cleanup = await this.prisma.video.findMany({
      where: {
        OR: [
          { status: "deleting" },
          { status: { in: ["completed", "failed"] }, rawDeletedAt: null },
        ],
      },
      take: 5,
      orderBy: { createdAt: "asc" },
    });
    for (const job of cleanup) {
      signal.throwIfAborted();
      await this.cleanupJob(job, signal);
    }
    signal.throwIfAborted();
    const job = await this.prisma.video.findFirst({
      where: {
        status: "pending",
        dogId: { not: null },
        exerciseId: { not: null },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    if (!job) return;
    const claimed = await this.prisma.video.updateMany({
      where: { id: job.id, status: "pending" },
      data: { status: "processing", error: null },
    });
    if (!claimed.count) return;
    await this.process(job, signal);
  }

  private async process(job: Video, signal: AbortSignal): Promise<void> {
    const directory = await mkdtemp(join(VIDEO_JOB_DIRECTORY, "job-"));
    const input = join(directory, "input");
    const output = join(directory, "output.mp4");
    try {
      await this.storage.download(job.filePath, input, signal);
      const duration = await this.transcoder.probe(input, signal);
      await this.transcoder.transcode(input, output, signal);
      // Delete the local original immediately, before uploading the encoded file.
      unlinkSync(input);
      await this.storage.upload(job.outputPath, output, "video/mp4", signal);
      await this.prisma.video.updateMany({
        where: { id: job.id, status: "processing" },
        data: { status: "completed", duration },
      });
      // A concurrent DELETE wins: terminal cleanup will remove both objects.
      const current = await this.prisma.video.findUnique({
        where: { id: job.id },
      });
      if (current) await this.cleanupJob(current, signal);
    } catch (error) {
      // Keep interrupted work recoverable during a graceful shutdown.
      if (this.stopping) return;
      const code =
        error instanceof InvalidVideoError
          ? "invalidVideo"
          : "processingFailed";
      this.logger.warn(`Video job ${job.id} failed (${code})`);
      await this.prisma.video.updateMany({
        where: { id: job.id, status: "processing" },
        data: { status: "failed", error: code },
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  }

  private async cleanupJob(job: Video, signal: AbortSignal): Promise<void> {
    if (!["completed", "failed", "deleting"].includes(job.status)) return;
    const paths =
      job.status === "completed"
        ? [job.filePath]
        : [job.filePath, job.outputPath];
    await this.storage.remove(paths, signal);
    if (job.status === "deleting") {
      await this.prisma.video.deleteMany({
        where: { id: job.id, status: "deleting" },
      });
    } else {
      await this.prisma.video.updateMany({
        where: { id: job.id, status: job.status },
        data: { rawDeletedAt: new Date() },
      });
    }
  }

  private async cleanupTemporaryFiles(): Promise<void> {
    await mkdir(VIDEO_JOB_DIRECTORY, { recursive: true });
    // This directory belongs exclusively to the global lock holder. A process
    // crash can leave files behind, but cannot leave an unbounded local queue.
    for (const name of await readdir(VIDEO_JOB_DIRECTORY)) {
      if (name.startsWith("job-"))
        await rm(join(VIDEO_JOB_DIRECTORY, name), {
          recursive: true,
          force: true,
        });
    }
    await mkdir(VIDEO_UPLOAD_DIRECTORY, { recursive: true });
    for (const name of await readdir(VIDEO_UPLOAD_DIRECTORY)) {
      const path = join(VIDEO_UPLOAD_DIRECTORY, name);
      const info = await stat(path).catch(() => undefined);
      if (info && info.mtimeMs < Date.now() - 60 * 60_000)
        await rm(path, { force: true });
    }
  }
}

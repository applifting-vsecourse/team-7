import { unlinkSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { Video } from "@/generated/prisma/client";
import { VideoStorageService } from "./video-storage.service";
import {
  InvalidVideoError,
  VideoTranscoderService,
} from "./video-transcoder.service";
import { VideoWorkerService } from "./video-worker.service";
import {
  VIDEO_JOB_TIMEOUT_MS,
  VIDEO_TRANSACTION_TIMEOUT_MS,
} from "./videos.constants";

vi.mock("node:fs", async (original) => ({
  ...(await original<object>()),
  unlinkSync: vi.fn(),
}));
vi.mock("node:fs/promises", async (original) => ({
  ...(await original<object>()),
  mkdir: vi.fn(),
  mkdtemp: vi.fn(),
  readdir: vi.fn().mockResolvedValue([]),
  rm: vi.fn(),
}));

describe("PostgreSQL video worker", () => {
  const prisma = mockDeep<PrismaService>();
  const storage = mockDeep<VideoStorageService>();
  const transcoder = mockDeep<VideoTranscoderService>();
  const tx = mockDeep<PrismaService>();
  const job = {
    id: "video",
    filePath: "raw/video",
    outputPath: "encoded/video.mp4",
    status: "pending",
    dogId: "dog",
    exerciseId: "exercise",
  } as Video;
  let worker: VideoWorkerService;
  let locked = false;
  let lockReleased = false;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    locked = false;
    lockReleased = false;
    Object.defineProperty(storage, "enabled", {
      configurable: true,
      value: true,
    });
    vi.mocked(mkdtemp).mockResolvedValue("/tmp/video-worker-test");
    tx.$queryRaw.mockImplementation((async (query: TemplateStringsArray) => {
      if (query.join().includes("pg_try_advisory"))
        return [{ acquired: !locked }];
      return [];
    }) as never);
    prisma.$transaction.mockImplementation((async (
      callback: (client: PrismaService) => Promise<void>,
    ) => {
      try {
        await callback(tx);
      } finally {
        locked = false;
        lockReleased = true;
      }
    }) as never);
    prisma.video.updateMany.mockResolvedValue({ count: 1 });
    prisma.video.findMany.mockResolvedValue([]);
    prisma.video.findFirst.mockResolvedValue(job);
    prisma.video.findUnique.mockResolvedValue({
      ...job,
      status: "completed",
    });
    storage.download.mockResolvedValue();
    storage.upload.mockResolvedValue();
    storage.remove.mockResolvedValue();
    transcoder.probe.mockResolvedValue(60);
    transcoder.transcode.mockResolvedValue();
    worker = new VideoWorkerService(prisma, storage, transcoder);
  });
  afterEach(async () => {
    await worker.onModuleDestroy();
    vi.useRealTimers();
  });

  it("does no work when another worker holds the database lock", async () => {
    locked = true;
    await worker.tick();
    expect(prisma.video.findFirst).not.toHaveBeenCalled();
    expect(transcoder.transcode).not.toHaveBeenCalled();
  });

  it("processes once despite concurrent local ticks and keeps the transaction open until done", async () => {
    let finish!: () => void;
    transcoder.transcode.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const running = worker.tick();
    await vi.waitFor(() => expect(transcoder.transcode).toHaveBeenCalledOnce());
    await worker.tick();
    expect(lockReleased).toBe(false);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      timeout: VIDEO_TRANSACTION_TIMEOUT_MS,
      maxWait: 2000,
    });
    finish();
    await running;
    expect(lockReleased).toBe(true);
  });

  it("unlinks the raw local file immediately after encoding, before upload, and removes the remote raw after completion", async () => {
    storage.upload.mockImplementation(async () => {
      expect(unlinkSync).toHaveBeenCalledWith("/tmp/video-worker-test/input");
    });
    await worker.tick();
    expect(prisma.video.updateMany).toHaveBeenCalledWith({
      where: { id: "video", status: "processing" },
      data: { status: "completed", duration: 60 },
    });
    expect(storage.remove).toHaveBeenCalledWith(
      ["raw/video"],
      expect.any(AbortSignal),
    );
    expect(rm).toHaveBeenCalledWith("/tmp/video-worker-test", {
      force: true,
      recursive: true,
    });
  });

  it("rejects invalid or overlong media without running FFmpeg and cleans the temporary directory", async () => {
    transcoder.probe.mockRejectedValue(
      new InvalidVideoError("Over 60 seconds"),
    );
    await worker.tick();
    expect(transcoder.transcode).not.toHaveBeenCalled();
    expect(prisma.video.updateMany).toHaveBeenCalledWith({
      where: { id: "video", status: "processing" },
      data: { status: "failed", error: "invalidVideo" },
    });
    expect(rm).toHaveBeenCalledWith("/tmp/video-worker-test", {
      force: true,
      recursive: true,
    });
  });

  it("recovers processing jobs and stale uploads only while holding the global lock", async () => {
    await worker.tick();
    expect(prisma.video.updateMany).toHaveBeenCalledWith({
      where: { status: "processing" },
      data: { status: "pending" },
    });
    expect(prisma.video.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "uploading", updatedAt: { lt: expect.any(Date) } },
        data: { status: "failed", error: "uploadFailed" },
      }),
    );
  });

  it("deletes both objects for deleted parents and removes the job only after successful storage cleanup", async () => {
    prisma.video.findMany.mockResolvedValue([
      { ...job, dogId: null, status: "deleting" },
    ]);
    prisma.video.findFirst.mockResolvedValue(null);
    await worker.tick();
    expect(storage.remove).toHaveBeenCalledWith(
      ["raw/video", "encoded/video.mp4"],
      expect.any(AbortSignal),
    );
    expect(prisma.video.deleteMany).toHaveBeenCalledWith({
      where: { id: "video", status: "deleting" },
    });
    expect(prisma.video.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { not: "uploading" },
          OR: [{ dogId: null }, { exerciseId: null }],
        },
        data: { status: "deleting" },
      }),
    );
  });

  it("retains cleanup jobs when Supabase is unavailable", async () => {
    prisma.video.findMany.mockResolvedValue([{ ...job, status: "deleting" }]);
    storage.remove.mockRejectedValue(new Error("offline"));
    await worker.tick();
    expect(prisma.video.deleteMany).not.toHaveBeenCalled();
    expect(transcoder.transcode).not.toHaveBeenCalled();
  });

  it("a concurrent delete wins over completion and cleans both objects", async () => {
    prisma.video.findUnique.mockResolvedValue({
      ...job,
      status: "deleting",
    });
    await worker.tick();
    expect(prisma.video.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "video", status: "processing" },
        data: { status: "completed", duration: 60 },
      }),
    );
    expect(storage.remove).toHaveBeenCalledWith(
      [job.filePath, job.outputPath],
      expect.any(AbortSignal),
    );
    expect(prisma.video.deleteMany).toHaveBeenCalled();
  });

  it("aborts timed-out work and awaits encoder termination before releasing the transaction lock", async () => {
    let killed = false;
    transcoder.transcode.mockImplementation(
      (_input, _output, signal) =>
        new Promise<void>((_resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => {
              killed = true;
              reject(new Error("killed"));
            },
            { once: true },
          );
        }),
    );
    const running = worker.tick();
    await vi.waitFor(() => expect(transcoder.transcode).toHaveBeenCalled());
    await vi.advanceTimersByTimeAsync(VIDEO_JOB_TIMEOUT_MS);
    await running;
    expect(killed).toBe(true);
    expect(lockReleased).toBe(true);
    expect(VIDEO_JOB_TIMEOUT_MS).toBeLessThan(VIDEO_TRANSACTION_TIMEOUT_MS);
  });

  it("kills the encoder on a lost lock heartbeat", async () => {
    transcoder.transcode.mockImplementation(
      (_input, _output, signal) =>
        new Promise<void>((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("killed")), {
            once: true,
          });
        }),
    );
    const running = worker.tick();
    await vi.waitFor(() => expect(transcoder.transcode).toHaveBeenCalled());
    tx.$queryRaw.mockRejectedValue(new Error("connection lost"));
    await vi.advanceTimersByTimeAsync(1000);
    await running;
    expect(prisma.video.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "failed", error: "processingFailed" },
      }),
    );
  });
});

import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { fileTypeFromFile } from "file-type";
import type {} from "multer";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { PrismaService } from "@/core/prisma/prisma.service";
import { VideoStorageService } from "./video-storage.service";
import {
  VIDEO_ADMISSION_LOCK,
  VIDEO_LIMIT,
  VIDEO_MAX_BYTES,
  VIDEO_MIME_TYPES,
  VIDEO_QUEUE_LIMIT,
} from "./videos.constants";

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: VideoStorageService,
  ) {}

  async assertAccess(userId: string, dogId: string, sessionId: string) {
    const dog = await this.prisma.dog.findFirst({
      where: { id: dogId, userId },
      select: { id: true },
    });
    if (!dog) throw new NotFoundException("Dog not found");
    const session = await this.prisma.scheduledExercise.findFirst({
      where: { id: sessionId, dogId, kind: "exercise", deletedAt: null },
      select: { id: true, exerciseId: true },
    });
    if (!session?.exerciseId)
      throw new NotFoundException("Training session not found");
    return session;
  }

  async upload(
    userId: string,
    dogId: string,
    sessionId: string,
    file?: Express.Multer.File,
  ) {
    if (!file?.path) throw new BadRequestException("Video file is required");
    let jobId: string | undefined;
    try {
      this.storage.assertEnabled();
      if (!file.size || file.size > VIDEO_MAX_BYTES) {
        throw new BadRequestException("Use MP4, MOV or WebM up to 30 MB");
      }
      await this.assertAccess(userId, dogId, sessionId);
      // Multipart MIME types and filenames are client-controlled. Detect the
      // container from bytes; the worker still probes and decodes its contents.
      const detected = await fileTypeFromFile(file.path);
      if (!detected || !VIDEO_MIME_TYPES.includes(detected.mime)) {
        throw new BadRequestException("Use MP4, MOV or WebM up to 30 MB");
      }
      const path = randomUUID();
      const job = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(${VIDEO_ADMISSION_LOCK})::text AS locked`;
        // Recheck the session inside admission; plan changes do not remove
        // the ability to attach videos to a historical training session.
        const session = await tx.scheduledExercise.findFirst({
          where: { id: sessionId, dogId, kind: "exercise", deletedAt: null },
          select: { exerciseId: true },
        });
        if (!session?.exerciseId)
          throw new NotFoundException("Training session not found");
        const count = await tx.video.count({
          where: { status: { in: ["uploading", "pending", "processing"] } },
        });
        if (count >= VIDEO_QUEUE_LIMIT)
          throw new HttpException("Video queue is full; try again later", 429);
        const videos = await tx.video.findMany({
          where: { dogId, sessionId, status: { not: "deleting" } },
          select: { slot: true },
        });
        const slot = Array.from({ length: VIDEO_LIMIT }, (_, i) => i + 1).find(
          (candidate) => !videos.some((video) => video.slot === candidate),
        );
        if (slot === undefined)
          throw new BadRequestException(
            `You can add at most ${VIDEO_LIMIT} videos per training session`,
          );
        return tx.video.create({
          data: {
            slot,
            userId,
            dogId,
            sessionId,
            exerciseId: session.exerciseId,
            filePath: `raw/${path}`,
            outputPath: `encoded/${path}.mp4`,
            status: "uploading",
          },
        });
      });
      jobId = job.id;
      await this.storage.upload(
        job.filePath,
        file.path,
        detected.mime,
        AbortSignal.timeout(30_000),
      );
      const result = await this.prisma.video.updateMany({
        where: { id: job.id, status: "uploading", dogId, sessionId },
        data: { status: "pending" },
      });
      if (!result.count)
        throw new NotFoundException("Video was removed during upload");
      return {
        id: job.id,
        status: "pending" as const,
        createdAt: job.createdAt,
      };
    } catch (error) {
      if (jobId)
        await this.prisma.video.updateMany({
          where: { id: jobId, status: "uploading" },
          data: { status: "failed", error: "uploadFailed" },
        });
      throw error;
    } finally {
      await rm(file.path, { force: true });
    }
  }

  async list(userId: string, dogId: string, sessionId: string) {
    await this.assertAccess(userId, dogId, sessionId);
    return this.prisma.video.findMany({
      where: { userId, dogId, sessionId, status: { not: "deleting" } },
      select: {
        id: true,
        status: true,
        duration: true,
        error: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    });
  }

  async playback(userId: string, dogId: string, sessionId: string, id: string) {
    await this.assertAccess(userId, dogId, sessionId);
    const job = await this.prisma.video.findFirst({
      where: { id, userId, dogId, sessionId, status: "completed" },
    });
    if (!job) throw new NotFoundException("Completed video not found");
    return {
      url: await this.storage.signedUrl(job.outputPath),
      expiresIn: 3600,
    };
  }

  async remove(
    userId: string,
    dogId: string,
    sessionId: string,
    id: string,
  ): Promise<void> {
    await this.assertAccess(userId, dogId, sessionId);
    const result = await this.prisma.video.updateMany({
      where: { id, userId, dogId, sessionId, status: { not: "uploading" } },
      data: { status: "deleting" },
    });
    if (!result.count) throw new NotFoundException("Video not found");
  }
}

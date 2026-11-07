import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from "@nestjs/common";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { VideoStorageService } from "./video-storage.service";
import { VIDEO_MAX_BYTES, VIDEO_QUEUE_LIMIT } from "./videos.constants";
import { VideosService } from "./videos.service";

// Container signatures only: full media validity remains the worker's job.
const mp4Header = Buffer.from(
  "000000186674797069736f6d0000000069736f6d6d703432",
  "hex",
);
const movHeader = Buffer.from(
  "0000001466747970717420200000000071742020",
  "hex",
);

// Use the same mocked client inside short admission transactions.
describe("exercise video uploads and ownership", () => {
  const prisma = mockDeep<PrismaService>();
  const storage = mockDeep<VideoStorageService>();
  const service = new VideosService(prisma, storage);
  let directory: string;
  let file: Express.Multer.File;

  beforeEach(async () => {
    vi.resetAllMocks();
    directory = await mkdtemp(join(tmpdir(), "video-service-test-"));
    const path = join(directory, "upload");
    await writeFile(path, mp4Header);
    file = {
      path,
      size: mp4Header.length,
      mimetype: "video/mp4",
    } as Express.Multer.File;
    prisma.dog.findFirst.mockResolvedValue({ id: "dog" } as never);
    prisma.exercise.findFirst.mockResolvedValue({ id: "exercise" } as never);
    prisma.dogExercise.findUnique.mockResolvedValue({
      exerciseId: "exercise",
    } as never);
    prisma.$transaction.mockImplementation((async (
      callback: (tx: PrismaService) => Promise<unknown>,
    ) => callback(prisma)) as never);
    prisma.video.count.mockResolvedValue(0);
    prisma.video.findMany.mockResolvedValue([]);
    prisma.video.create.mockImplementation((async ({
      data,
    }: {
      data: object;
    }) => ({ id: "video", createdAt: new Date(0), ...data })) as never);
    prisma.video.updateMany.mockResolvedValue({ count: 1 });
  });
  afterEach(async () => {
    await rm(directory, { force: true, recursive: true });
  });

  it("persists a durable raw object before making the job pending, and removes the local upload", async () => {
    const result = await service.upload("user", "dog", "exercise", file);
    expect(result).toMatchObject({ id: "video", status: "pending" });
    expect(prisma.video.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user",
        dogId: "dog",
        exerciseId: "exercise",
        status: "uploading",
      }),
    });
    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^raw\/[\da-f-]+$/),
      file.path,
      "video/mp4",
      expect.any(AbortSignal),
    );
    expect(prisma.video.updateMany).toHaveBeenCalledWith({
      where: {
        id: "video",
        status: "uploading",
        dogId: "dog",
        exerciseId: "exercise",
      },
      data: { status: "pending" },
    });
    expect(storage.upload.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.video.updateMany.mock.invocationCallOrder[0],
    );
    await expect(readFile(file.path)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it.each([0, VIDEO_MAX_BYTES + 1])(
    "rejects size %i and removes the temporary upload",
    async (size) => {
      await expect(
        service.upload("user", "dog", "exercise", { ...file, size }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.upload).not.toHaveBeenCalled();
      await expect(readFile(file.path)).rejects.toMatchObject({
        code: "ENOENT",
      });
    },
  );

  it("does not accept a missing file", async () => {
    await expect(
      service.upload("user", "dog", "exercise"),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.video.create).not.toHaveBeenCalled();
  });

  it.each(["", "application/octet-stream", "video/quicktime"])(
    "accepts MOV bytes with declared MIME %j and stores the detected type",
    async (mimetype) => {
      await writeFile(file.path, movHeader);
      await service.upload("user", "dog", "exercise", {
        ...file,
        mimetype,
        originalname: "clip.MOV",
        size: movHeader.length,
      });
      expect(storage.upload).toHaveBeenCalledWith(
        expect.any(String),
        file.path,
        "video/quicktime",
        expect.any(AbortSignal),
      );
    },
  );

  it.each([
    Buffer.from("not a video"),
    Buffer.from("GIF89a"),
    Buffer.from("0000001866747970", "hex"),
  ])(
    "rejects unsupported or truncated bytes despite a video MIME and filename",
    async (bytes) => {
      await writeFile(file.path, bytes);
      await expect(
        service.upload("user", "dog", "exercise", {
          ...file,
          originalname: "clip.mp4",
          size: bytes.length,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.video.create).not.toHaveBeenCalled();
      expect(storage.upload).not.toHaveBeenCalled();
      await expect(readFile(file.path)).rejects.toMatchObject({
        code: "ENOENT",
      });
    },
  );

  it("bounds the global queue while holding the admission lock", async () => {
    prisma.video.count.mockResolvedValue(VIDEO_QUEUE_LIMIT);
    const result = service.upload("user", "dog", "exercise", file);
    await expect(result).rejects.toBeInstanceOf(HttpException);
    await expect(result).rejects.toMatchObject({ status: 429 });
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.video.create).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it("rejects an owned exercise not assigned to this dog before creating a job or storing the upload", async () => {
    prisma.dogExercise.findUnique.mockResolvedValue(null);
    await expect(
      service.upload("user", "dog", "exercise", file),
    ).rejects.toThrow("Exercise is not assigned to this dog");
    expect(prisma.dogExercise.findUnique).toHaveBeenCalledWith({
      where: { dogId_exerciseId: { dogId: "dog", exerciseId: "exercise" } },
      select: { exerciseId: true },
    });
    expect(prisma.video.create).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
    await expect(readFile(file.path)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps historical videos readable and removable after the assignment is removed", async () => {
    prisma.dogExercise.findUnique.mockResolvedValue(null);
    prisma.video.findFirst.mockResolvedValue({
      outputPath: "encoded/video.mp4",
    } as never);
    storage.signedUrl.mockResolvedValue("https://storage.example/signed");

    await expect(service.list("user", "dog", "exercise")).resolves.toEqual([]);
    await expect(
      service.playback("user", "dog", "exercise", "video"),
    ).resolves.toMatchObject({
      url: "https://storage.example/signed",
    });
    await expect(
      service.remove("user", "dog", "exercise", "video"),
    ).resolves.toBeUndefined();
    expect(prisma.video.updateMany).toHaveBeenCalledWith({
      where: {
        id: "video",
        userId: "user",
        dogId: "dog",
        exerciseId: "exercise",
        status: { not: "uploading" },
      },
      data: { status: "deleting" },
    });
  });

  it("rejects a fourth video before storage upload and removes the temporary file", async () => {
    prisma.video.findMany.mockResolvedValue([
      { slot: 1 },
      { slot: 2 },
      { slot: 3 },
    ] as never);
    await expect(
      service.upload("user", "dog", "exercise", file),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.video.findMany).toHaveBeenCalledWith({
      where: {
        dogId: "dog",
        exerciseId: "exercise",
        status: { not: "deleting" },
      },
      select: { slot: true },
    });
    expect(prisma.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.video.findMany.mock.invocationCallOrder[0],
    );
    expect(prisma.video.create).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
    await expect(readFile(file.path)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it.each([
    [[], 1],
    [[1, 2], 3],
    [[1, 3], 2],
  ])(
    "allocates a free slot with occupied slots %j",
    async (slots, expected) => {
      prisma.video.findMany.mockResolvedValue(
        slots.map((slot) => ({ slot })) as never,
      );
      await service.upload("user", "dog", "exercise", file);
      expect(prisma.video.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ slot: expected }),
      });
    },
  );

  it("retains a failed job for retryable remote cleanup when storage fails", async () => {
    storage.upload.mockRejectedValue(new Error("storage unavailable"));
    await expect(
      service.upload("user", "dog", "exercise", file),
    ).rejects.toThrow("storage unavailable");
    expect(prisma.video.updateMany).toHaveBeenCalledWith({
      where: { id: "video", status: "uploading" },
      data: { status: "failed", error: "uploadFailed" },
    });
    await expect(readFile(file.path)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects another owner's dog before accessing any video", async () => {
    prisma.dog.findFirst.mockResolvedValue(null);
    await expect(
      service.list("attacker", "dog", "exercise"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.dog.findFirst).toHaveBeenCalledWith({
      where: { id: "dog", userId: "attacker" },
      select: { id: true },
    });
    expect(prisma.exercise.findFirst).not.toHaveBeenCalled();
    expect(prisma.video.findMany).not.toHaveBeenCalled();
  });

  it("rejects another owner's exercise", async () => {
    prisma.exercise.findFirst.mockResolvedValue(null);
    await expect(
      service.remove("user", "dog", "foreign", "video"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.exercise.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign", goal: { discipline: { userId: "user" } } },
      select: { id: true },
    });
    expect(prisma.video.updateMany).not.toHaveBeenCalled();
  });

  it("only signs a completed video owned by this handler and belonging to this dog and exercise", async () => {
    prisma.video.findFirst.mockResolvedValue({
      outputPath: "encoded/video.mp4",
    } as never);
    storage.signedUrl.mockResolvedValue("https://storage.example/signed");
    expect(await service.playback("user", "dog", "exercise", "video")).toEqual({
      url: "https://storage.example/signed",
      expiresIn: 3600,
    });
    expect(prisma.video.findFirst).toHaveBeenCalledWith({
      where: {
        id: "video",
        userId: "user",
        dogId: "dog",
        exerciseId: "exercise",
        status: "completed",
      },
    });
    prisma.video.findFirst.mockResolvedValue(null);
    await expect(
      service.playback("user", "dog", "exercise", "other"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.signedUrl).toHaveBeenCalledTimes(1);
  });

  it("hides deleted jobs and internal object paths in the status list", async () => {
    await service.list("user", "dog", "exercise");
    const args = prisma.video.findMany.mock.calls[0][0]!;
    expect(args.where).toMatchObject({
      userId: "user",
      dogId: "dog",
      exerciseId: "exercise",
      status: { not: "deleting" },
    });
    expect(args.select).not.toHaveProperty("filePath");
    expect(args.select).not.toHaveProperty("outputPath");
  });
});

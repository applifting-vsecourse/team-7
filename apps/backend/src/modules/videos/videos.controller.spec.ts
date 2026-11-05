import {
  INestApplication,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { rm } from "node:fs/promises";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getSessionFromRequest } from "@/shared/auth/utils/get-session-from-request";
import { VideoStorageService } from "./video-storage.service";
import { VIDEO_MAX_BYTES } from "./videos.constants";
import {
  VideoOwnerGuard,
  VideosController,
  VideoUploadInterceptor,
} from "./videos.controller";
import { VideosService } from "./videos.service";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});
vi.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("exercise video HTTP boundary", () => {
  let app: INestApplication;
  let url: string;
  const videos = {
    assertAccess: vi.fn(),
    upload: vi.fn(),
    list: vi.fn(),
    playback: vi.fn(),
    remove: vi.fn(),
  };
  const storage = { assertEnabled: vi.fn() };
  const getSession = vi.mocked(getSessionFromRequest);
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        VideoOwnerGuard,
        VideoUploadInterceptor,
        { provide: VideosService, useValue: videos },
        { provide: VideoStorageService, useValue: storage },
        { provide: "BetterAuth", useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    url = `${await app.getUrl()}/api/dogs/dog/exercises/exercise/videos`;
  });
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({
      user: { id: "user", emailVerified: true },
    } as never);
    videos.list.mockResolvedValue([]);
    videos.playback.mockResolvedValue({
      url: "https://storage.example/video",
      expiresIn: 3600,
    });
    videos.upload.mockImplementation(
      async (_user, _dog, _exercise, file?: Express.Multer.File) => {
        if (file) await rm(file.path, { force: true });
        return { id: "video", status: "pending" };
      },
    );
  });
  afterAll(async () => {
    await app.close();
  });

  function upload(bytes = new Uint8Array([1, 2, 3])) {
    const body = new FormData();
    body.set(
      "file",
      new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "video/mp4" }),
      "clip.mp4",
    );
    return fetch(url, { method: "POST", body });
  }

  it("accepts a single multipart file on disk and returns 202", async () => {
    const response = await upload();
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ id: "video", status: "pending" });
    expect(videos.upload).toHaveBeenCalledWith(
      "user",
      "dog",
      "exercise",
      expect.objectContaining({
        path: expect.any(String),
        size: 3,
        mimetype: "video/mp4",
      }),
    );
    expect(videos.upload.mock.calls[0][3]).not.toHaveProperty("buffer");
  });

  it("rejects uploads larger than 30 MB before invoking the service", async () => {
    expect((await upload(new Uint8Array(VIDEO_MAX_BYTES + 1))).status).toBe(
      413,
    );
    expect(videos.upload).not.toHaveBeenCalled();
  });

  it("accepts a video exactly at the 30 MB boundary", async () => {
    expect((await upload(new Uint8Array(VIDEO_MAX_BYTES))).status).toBe(202);
    expect(videos.upload).toHaveBeenCalledWith(
      "user",
      "dog",
      "exercise",
      expect.objectContaining({ size: VIDEO_MAX_BYTES }),
    );
  });

  it.each([
    ["GET", ""],
    ["POST", ""],
    ["GET", "/video/playback"],
    ["DELETE", "/video"],
  ])("requires authentication for %s %s", async (method, suffix) => {
    getSession.mockResolvedValue(null);
    expect((await fetch(`${url}${suffix}`, { method })).status).toBe(401);
    expect(videos.assertAccess).not.toHaveBeenCalled();
    expect(videos.upload).not.toHaveBeenCalled();
    expect(videos.list).not.toHaveBeenCalled();
    expect(videos.playback).not.toHaveBeenCalled();
    expect(videos.remove).not.toHaveBeenCalled();
  });

  it("checks ownership before accepting a multipart body", async () => {
    videos.assertAccess.mockRejectedValue(new NotFoundException());
    expect((await upload()).status).toBe(404);
    expect(videos.upload).not.toHaveBeenCalled();
  });

  it("refuses uploads before writing a file if storage is disabled", async () => {
    storage.assertEnabled.mockImplementation(() => {
      throw new ServiceUnavailableException();
    });
    expect((await upload()).status).toBe(503);
    expect(videos.upload).not.toHaveBeenCalled();
  });

  it("lists jobs, signs playback, and queues deletion using session ownership", async () => {
    expect((await fetch(url)).status).toBe(200);
    expect(videos.list).toHaveBeenCalledWith("user", "dog", "exercise");
    expect((await fetch(`${url}/video/playback`)).status).toBe(200);
    expect(videos.playback).toHaveBeenCalledWith(
      "user",
      "dog",
      "exercise",
      "video",
    );
    expect((await fetch(`${url}/video`, { method: "DELETE" })).status).toBe(
      202,
    );
    expect(videos.remove).toHaveBeenCalledWith(
      "user",
      "dog",
      "exercise",
      "video",
    );
  });

  it("rejects unexpected fields and multiple files", async () => {
    const body = new FormData();
    body.set("userId", "other-user");
    expect((await fetch(url, { method: "POST", body })).status).toBe(400);
    const multiple = new FormData();
    multiple.append("file", new Blob(["one"]), "one.mp4");
    multiple.append("file", new Blob(["two"]), "two.mp4");
    expect((await fetch(url, { method: "POST", body: multiple })).status).toBe(
      400,
    );
    expect(videos.upload).not.toHaveBeenCalled();
  });
});

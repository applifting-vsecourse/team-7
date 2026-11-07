import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Config } from "@/shared/config/config.service";
import { VideoStorageService } from "./video-storage.service";
import { VIDEO_MAX_BYTES } from "./videos.constants";

describe("private Supabase video storage", () => {
  const config = {
    supabaseUrl: "https://project.supabase.co/",
    supabaseSecretKey: "sb_secret_test-only",
    supabaseVideoBucket: "exercise-videos",
  } as Config;
  const storage = new VideoStorageService(config);
  const fetchMock = vi.fn<typeof fetch>();
  let directory: string;
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    directory = await mkdtemp(join(tmpdir(), "video-storage-test-"));
  });
  afterEach(async () => {
    try {
      // Every storage operation must use the secret key as an API key, never a JWT.
      for (const [, init] of fetchMock.mock.calls) {
        const headers = new Headers(init?.headers);
        expect(headers.get("apikey")).toBe(config.supabaseSecretKey);
        expect(headers.has("Authorization")).toBe(false);
      }
    } finally {
      vi.unstubAllGlobals();
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("streams a file into the private bucket without loading it into a Buffer", async () => {
    const path = join(directory, "input");
    await writeFile(path, "video bytes");
    let uploaded = "";
    fetchMock.mockImplementation(async (_url, init) => {
      expect(init?.body).not.toBeInstanceOf(Buffer);
      for await (const chunk of init!.body as unknown as AsyncIterable<Buffer>)
        uploaded += chunk.toString();
      expect(new Headers(init?.headers).get("Content-Length")).toBe("11");
      return new Response("{}", { status: 200 });
    });
    await storage.upload(
      "raw/uuid",
      path,
      "video/mp4",
      new AbortController().signal,
    );
    expect(uploaded).toBe("video bytes");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://project.supabase.co/storage/v1/object/exercise-videos/raw/uuid",
      expect.objectContaining({ method: "POST", duplex: "half" }),
    );
  });

  it("streams downloads to disk", async () => {
    fetchMock.mockResolvedValue(new Response("downloaded video"));
    const path = join(directory, "input");
    await storage.download("raw/uuid", path, new AbortController().signal);
    expect(await readFile(path, "utf8")).toBe("downloaded video");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://project.supabase.co/storage/v1/object/authenticated/exercise-videos/raw/uuid",
      expect.any(Object),
    );
  });

  it("enforces the byte limit even when the provider omits Content-Length", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(VIDEO_MAX_BYTES + 1));
            controller.close();
          },
        }),
      ),
    );
    await expect(
      storage.download(
        "raw/uuid",
        join(directory, "input"),
        new AbortController().signal,
      ),
    ).rejects.toThrow("30 MB");
  });

  it("uses expiring playback URLs and authenticates only on the server", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        signedURL: "/object/sign/exercise-videos/encoded/uuid.mp4?token=signed",
      }),
    );
    expect(await storage.signedUrl("encoded/uuid.mp4")).toBe(
      "https://project.supabase.co/storage/v1/object/sign/exercise-videos/encoded/uuid.mp4?token=signed",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify({ expiresIn: 3600 }) }),
    );
  });

  it("deletes through the Storage API and sanitizes provider failures", async () => {
    fetchMock.mockResolvedValue(new Response("{}"));
    await storage.remove(
      ["raw/uuid", "encoded/uuid.mp4"],
      new AbortController().signal,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://project.supabase.co/storage/v1/object/exercise-videos",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ prefixes: ["raw/uuid", "encoded/uuid.mp4"] }),
      }),
    );
    fetchMock.mockResolvedValue(
      new Response("sensitive provider response", { status: 500 }),
    );
    await expect(storage.signedUrl("encoded/uuid.mp4")).rejects.toThrow(
      "Video storage request failed (500)",
    );
  });

  it("disables uploads when Supabase is not configured", () => {
    const disabled = new VideoStorageService({} as Config);
    expect(disabled.enabled).toBe(false);
    expect(() => disabled.assertEnabled()).toThrow("not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

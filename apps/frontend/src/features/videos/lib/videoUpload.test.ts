import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { validateVideo, VIDEO_MAX_BYTES } from "./videoUpload";

let media: HTMLVideoElement;
let duration = 42;
let invalid = false;
const revoke = vi.fn();
const createUrl = vi.fn(() => "blob:video");
const load = vi.fn();
beforeEach(() => {
  duration = 42;
  invalid = false;
  vi.stubGlobal("URL", {
    createObjectURL: createUrl,
    revokeObjectURL: revoke,
  });
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(load);
  const create = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((...args) => {
    const element = create(...args);
    if (element instanceof HTMLVideoElement) {
      media = element;
      Object.defineProperties(element, {
        duration: { get: () => duration },
        videoWidth: { value: 1280 },
        videoHeight: { value: 720 },
        src: {
          set: () => {
            queueMicrotask(() =>
              element.dispatchEvent(
                new Event(invalid ? "error" : "loadedmetadata"),
              ),
            );
          },
        },
      });
    }
    return element;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
const clip = () => new File(["video"], "clip.mp4", { type: "video/mp4" });

describe("video upload validation", () => {
  it.each(["", "application/octet-stream"])(
    "validates metadata for supported extensions with MIME %j",
    async (type) => {
      for (const name of ["clip.mp4", "clip.MOV", "clip.webm"]) {
        await expect(
          validateVideo(new File(["video"], name, { type })),
        ).resolves.toBeUndefined();
      }
      expect(createUrl).toHaveBeenCalledTimes(3);
    },
  );
  it.each(["", "application/octet-stream", "image/jpeg"])(
    "rejects unsupported files with MIME %j before reading metadata",
    async (type) => {
      await expect(
        validateVideo(new File(["image"], "photo.jpg", { type })),
      ).rejects.toThrow("videos.invalid");
      expect(createUrl).not.toHaveBeenCalled();
    },
  );
  it("does not let a video extension override an explicit non-video MIME", async () => {
    await expect(
      validateVideo(new File(["image"], "clip.mov", { type: "image/jpeg" })),
    ).rejects.toThrow("videos.invalid");
    expect(createUrl).not.toHaveBeenCalled();
  });
  it("rejects undecodable videos with a generic MIME", async () => {
    invalid = true;
    await expect(
      validateVideo(
        new File(["broken"], "clip.mov", { type: "application/octet-stream" }),
      ),
    ).rejects.toThrow("videos.invalid");
    expect(revoke).toHaveBeenCalled();
  });
  it("rejects oversized files before creating a media URL", async () => {
    const file = clip();
    Object.defineProperty(file, "size", { value: VIDEO_MAX_BYTES + 1 });
    await expect(validateVideo(file)).rejects.toThrow("videos.tooLarge");
    expect(createUrl).not.toHaveBeenCalled();
  });
  it("rejects unsupported file types", async () => {
    await expect(
      validateVideo(new File(["image"], "photo.jpg", { type: "image/jpeg" })),
    ).rejects.toThrow("videos.invalid");
    expect(createUrl).not.toHaveBeenCalled();
  });
  it("accepts a video at the duration and size limits and releases resources", async () => {
    duration = 60;
    const file = clip();
    Object.defineProperty(file, "size", { value: VIDEO_MAX_BYTES });
    await expect(validateVideo(file)).resolves.toBeUndefined();
    expect(revoke).toHaveBeenCalledWith("blob:video");
    expect(media.onloadedmetadata).toBeNull();
    expect(load).toHaveBeenCalled();
  });
  it.each([60.01, 100])(
    "rejects duration %s before uploading",
    async (value) => {
      duration = value;
      await expect(validateVideo(clip())).rejects.toThrow("videos.tooLong");
      expect(revoke).toHaveBeenCalled();
    },
  );
  it.each([Infinity, NaN, 0])(
    "rejects unreadable duration %s",
    async (value) => {
      duration = value;
      await expect(validateVideo(clip())).rejects.toThrow("videos.invalid");
      expect(revoke).toHaveBeenCalled();
    },
  );
  it("cleans up when the decoder fails", async () => {
    invalid = true;
    await expect(validateVideo(clip())).rejects.toThrow("videos.invalid");
    expect(revoke).toHaveBeenCalled();
  });
});

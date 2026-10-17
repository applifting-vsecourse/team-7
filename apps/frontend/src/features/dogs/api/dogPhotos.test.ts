import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { photoFormData } from "./dogPhotos";

describe("canvas avatar preparation", () => {
  const drawImage = vi.fn();
  const encoded = new Blob(["encoded avatar"], { type: "image/webp" });
  const file = new File(["original photo"], "dog.jpg", { type: "image/jpeg" });

  beforeEach(() => {
    drawImage.mockClear();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:original"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
      640,
    );
    vi.spyOn(
      HTMLImageElement.prototype,
      "naturalHeight",
      "get",
    ).mockReturnValue(320);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => callback(encoded),
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([
    [0, 0],
    [50, 160],
    [100, 320],
  ])(
    "crops a landscape photo at %s%% and sends only the resized image",
    async (position, left) => {
      const body = await photoFormData({
        file,
        position: { x: position / 100, y: position / 100 },
        zoom: 1,
      });
      expect(drawImage).toHaveBeenCalledWith(
        expect.any(HTMLImageElement),
        left,
        0,
        320,
        320,
        0,
        0,
        128,
        128,
      );
      const canvas = vi.mocked(HTMLCanvasElement.prototype).toBlob.mock
        .instances[0];
      expect(canvas).toMatchObject({ width: 128, height: 128 });
      expect(
        vi.mocked(HTMLCanvasElement.prototype).toBlob.mock.calls[0],
      ).toEqual([expect.any(Function), "image/webp", 0.8]);
      const upload = body.get("file") as File;
      expect(upload).not.toBe(file);
      expect(upload.type).toBe("image/webp");
      expect(upload.size).toBe(encoded.size);
      expect(body.has("position")).toBe(false);
      expect(vi.mocked(URL).revokeObjectURL).toHaveBeenCalledWith(
        "blob:original",
      );
    },
  );

  it("crops portrait photos using the same position as the preview", async () => {
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
      320,
    );
    vi.spyOn(
      HTMLImageElement.prototype,
      "naturalHeight",
      "get",
    ).mockReturnValue(640);
    await photoFormData({ file, position: { x: 1, y: 1 }, zoom: 1 });
    expect(drawImage).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      0,
      320,
      320,
      320,
      0,
      0,
      128,
      128,
    );
  });

  it("accepts PNG output when the browser cannot encode WebP", async () => {
    vi.mocked(HTMLCanvasElement.prototype).toBlob.mockImplementation(
      (callback) => callback(new Blob(["png"], { type: "image/png" })),
    );
    const body = await photoFormData({
      file,
      position: { x: 0.5, y: 0.5 },
      zoom: 1,
    });
    expect((body.get("file") as File).name).toBe("avatar.png");
  });

  it("releases the source URL when decoding fails", async () => {
    vi.mocked(HTMLImageElement.prototype).decode.mockRejectedValue(
      new Error("Invalid image"),
    );
    await expect(
      photoFormData({ file, position: { x: 0.5, y: 0.5 }, zoom: 1 }),
    ).rejects.toThrow("Invalid image");
    expect(drawImage).not.toHaveBeenCalled();
    expect(vi.mocked(URL).revokeObjectURL).toHaveBeenCalledWith(
      "blob:original",
    );
  });

  it("fails cleanly when canvas encoding returns no image", async () => {
    vi.mocked(HTMLCanvasElement.prototype).toBlob.mockImplementation(
      (callback) => callback(null),
    );
    await expect(
      photoFormData({ file, position: { x: 0.5, y: 0.5 }, zoom: 1 }),
    ).rejects.toThrow("Unable to encode");
    expect(vi.mocked(URL).revokeObjectURL).toHaveBeenCalledWith(
      "blob:original",
    );
  });
});

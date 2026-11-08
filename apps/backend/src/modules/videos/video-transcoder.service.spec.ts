import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  InvalidVideoError,
  VideoTranscoderService,
} from "./video-transcoder.service";

vi.mock("node:child_process", () => ({ spawn: vi.fn() }));

class Child extends EventEmitter {
  stdout = new PassThrough();
  stderr = new PassThrough();
  kill = vi.fn();
}

describe("memory-bounded video transcoder", () => {
  const service = new VideoTranscoderService();
  let child: Child;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    child = new Child();
    vi.mocked(spawn).mockReturnValue(child as never);
  });
  afterEach(() => vi.useRealTimers());

  function metadata(duration: string, width = 1920, height = 1080) {
    child.stdout.write(
      JSON.stringify({ format: { duration }, streams: [{ width, height }] }),
    );
    child.emit("close", 0);
  }

  it("accepts 60 seconds and probes only the first video stream without allowing network protocols", async () => {
    const result = service.probe("/tmp/input", new AbortController().signal);
    metadata("60");
    expect(await result).toBe(60);
    expect(spawn).toHaveBeenCalledWith(
      "ffprobe",
      expect.arrayContaining([
        "-protocol_whitelist",
        "file,pipe",
        "-format_whitelist",
        "mov,matroska,webm",
        "-select_streams",
        "v:0",
      ]),
      expect.any(Object),
    );
  });

  it.each(["60.01", "0", "-1", "NaN", "Infinity", "N/A"])(
    "rejects invalid or excessive duration %s",
    async (duration) => {
      const result = service.probe("/tmp/input", new AbortController().signal);
      metadata(duration);
      await expect(result).rejects.toBeInstanceOf(InvalidVideoError);
    },
  );

  it.each([
    [7680, 4320],
    [0, 1080],
    [4097, 100],
    [3840, 3840],
  ])("rejects unsafe frame dimensions %i × %i", async (width, height) => {
    const result = service.probe("/tmp/input", new AbortController().signal);
    metadata("30", width, height);
    await expect(result).rejects.toBeInstanceOf(InvalidVideoError);
  });

  it("rejects audio-only and malformed files", async () => {
    let result = service.probe("/tmp/input", new AbortController().signal);
    child.stdout.write(
      JSON.stringify({ format: { duration: "30" }, streams: [] }),
    );
    child.emit("close", 0);
    await expect(result).rejects.toBeInstanceOf(InvalidVideoError);
    child = new Child();
    vi.mocked(spawn).mockReturnValue(child as never);
    result = service.probe("/tmp/input", new AbortController().signal);
    child.stdout.write("broken metadata");
    child.emit("close", 0);
    await expect(result).rejects.toBeInstanceOf(InvalidVideoError);
  });

  it("caps decoder and encoder threads, scales without upscaling, and emits browser-compatible MP4", async () => {
    const result = service.transcode(
      "/tmp/input",
      "/tmp/output.mp4",
      new AbortController().signal,
    );
    const args = vi.mocked(spawn).mock.calls[0][1] as string[];
    expect(args.filter((arg) => arg === "-threads")).toHaveLength(2);
    for (const [index, arg] of args.entries())
      if (arg === "-threads") expect(args[index + 1]).toBe("2");
    expect(args).toEqual(
      expect.arrayContaining([
        "-filter_threads",
        "1",
        "libx264",
        "veryfast",
        "24",
        "2500k",
        "yuv420p",
        "aac",
        "128k",
        "+faststart",
      ]),
    );
    expect(args[args.indexOf("-vf") + 1]).toContain("min(720,ih)");
    child.emit("close", 0);
    await result;
  });

  it("kills a stalled encoder after 90 seconds but waits for process close before rejecting", async () => {
    let settled = false;
    const result = service.transcode("in", "out", new AbortController().signal);
    void result.catch(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(90_000);
    expect(child.kill).toHaveBeenCalledWith("SIGKILL");
    expect(settled).toBe(false);
    child.emit("close", null);
    await expect(result).rejects.toThrow("timed out");
  });

  it("kills FFmpeg when the worker loses its lock and waits for termination", async () => {
    const controller = new AbortController();
    const result = service.transcode("in", "out", controller.signal);
    controller.abort();
    expect(child.kill).toHaveBeenCalledWith("SIGKILL");
    child.emit("close", null);
    await expect(result).rejects.toThrow("interrupted");
  });

  it("handles spawn errors and nonzero exit codes", async () => {
    let result = service.transcode("in", "out", new AbortController().signal);
    child.emit("error", new Error("ENOENT"));
    child.emit("close", -2);
    await expect(result).rejects.toThrow("ENOENT");
    child = new Child();
    vi.mocked(spawn).mockReturnValue(child as never);
    result = service.transcode("in", "out", new AbortController().signal);
    child.emit("close", 1);
    await expect(result).rejects.toBeInstanceOf(InvalidVideoError);
  });
});

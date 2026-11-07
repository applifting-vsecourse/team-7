import { Injectable } from "@nestjs/common";
import { spawn } from "node:child_process";
import { VIDEO_MAX_SECONDS } from "./videos.constants";

export class InvalidVideoError extends Error {}

@Injectable()
export class VideoTranscoderService {
  async probe(inputPath: string, signal: AbortSignal): Promise<number> {
    const output = await this.run(
      "ffprobe",
      [
        "-v",
        "error",
        "-protocol_whitelist",
        "file,pipe",
        "-format_whitelist",
        "mov,matroska,webm",
        "-select_streams",
        "v:0",
        "-show_entries",
        "format=duration:stream=width,height,codec_type,duration",
        "-of",
        "json",
        inputPath,
      ],
      signal,
      10_000,
    );
    let metadata: {
      format?: { duration?: string };
      streams?: { width?: number; height?: number; duration?: string }[];
    };
    try {
      metadata = JSON.parse(output);
    } catch {
      throw new InvalidVideoError("Invalid video metadata");
    }
    const video = metadata.streams?.[0];
    const duration = Number(metadata.format?.duration);
    // Avoid huge decoded frames on the 512 MB host. File size alone cannot do this.
    if (
      !video?.width ||
      !video.height ||
      video.width * video.height > 3840 * 2160 ||
      video.width > 4096 ||
      video.height > 4096 ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      duration > VIDEO_MAX_SECONDS ||
      (video.duration !== undefined &&
        Number(video.duration) > VIDEO_MAX_SECONDS)
    ) {
      throw new InvalidVideoError("Video must be at most 60 seconds and 4K");
    }
    return duration;
  }

  async transcode(
    inputPath: string,
    outputPath: string,
    signal: AbortSignal,
  ): Promise<void> {
    await this.run(
      "ffmpeg",
      [
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-protocol_whitelist",
        "file,pipe",
        "-format_whitelist",
        "mov,matroska,webm",
        "-threads",
        "2",
        "-i",
        inputPath,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        "-map_metadata",
        "-1",
        "-map_chapters",
        "-1",
        "-filter_threads",
        "1",
        "-vf",
        // Match the bounds to the frame orientation after FFmpeg autorotation.
        "scale=w='min(iw,if(gte(iw,ih),1280,720))':h='min(ih,if(gte(iw,ih),720,1280))':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1",
        "-r",
        "30",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "24",
        "-maxrate",
        "2500k",
        "-bufsize",
        "2500k",
        "-threads",
        "2",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-ac",
        "2",
        "-t",
        String(VIDEO_MAX_SECONDS),
        "-fs",
        "25000000",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      signal,
      90_000,
    );
  }

  private run(
    command: string,
    args: string[],
    signal: AbortSignal,
    timeout: number,
  ): Promise<string> {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      let stopped = false;
      const stop = () => {
        stopped = true;
        child.kill("SIGKILL");
      };
      const timer = setTimeout(stop, timeout);
      signal.addEventListener("abort", stop, { once: true });
      child.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
        if (stdout.length > 64 * 1024) stop();
      });
      child.stderr.on("data", (data: Buffer) => {
        stderr = (stderr + data.toString()).slice(-4096);
      });
      let spawnError: Error | undefined;
      child.on("error", (error) => {
        spawnError = error;
      });
      // Wait for close, including on abort: never release the lock while FFmpeg lives.
      child.on("close", (code) => {
        clearTimeout(timer);
        signal.removeEventListener("abort", stop);
        if (spawnError) reject(spawnError);
        else if (stopped || signal.aborted)
          reject(new Error(`${command} interrupted or timed out`));
        else if (code !== 0)
          reject(
            new InvalidVideoError(
              `${command} exited with code ${code}: ${stderr}`,
            ),
          );
        else resolve(stdout);
      });
      if (signal.aborted) stop();
    });
  }
}

import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createReadStream, createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Config } from "@/shared/config/config.service";
import { VIDEO_MAX_BYTES } from "./videos.constants";

/** Streaming REST calls avoid buffering videos or adding a second storage client. */
@Injectable()
export class VideoStorageService {
  constructor(private readonly config: Config) {}

  get enabled(): boolean {
    return Boolean(
      this.config.supabaseUrl &&
      this.config.supabaseSecretKey &&
      this.config.supabaseVideoBucket,
    );
  }

  assertEnabled(): void {
    if (!this.enabled)
      throw new ServiceUnavailableException("Video storage is not configured");
  }

  private get base(): string {
    this.assertEnabled();
    return `${this.config.supabaseUrl!.replace(/\/$/, "")}/storage/v1`;
  }

  private objectPath(path: string): string {
    return `${encodeURIComponent(this.config.supabaseVideoBucket!)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  }

  private async request(
    path: string,
    init: RequestInit,
    signal: AbortSignal,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("apikey", this.config.supabaseSecretKey!);
    // sb_secret keys authenticate through apikey; they are not bearer JWTs.
    const response = await fetch(`${this.base}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
    });
    if (!response.ok) {
      await response.body?.cancel();
      // Do not expose credentials, signed URLs or provider response bodies.
      throw new ServiceUnavailableException(
        `Video storage request failed (${response.status})`,
      );
    }
    return response;
  }

  async upload(
    path: string,
    localPath: string,
    contentType: string,
    signal: AbortSignal,
  ): Promise<void> {
    const input = createReadStream(localPath);
    try {
      const response = await this.request(
        `/object/${this.objectPath(path)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": contentType,
            "Content-Length": String((await stat(localPath)).size),
            "x-upsert": "true",
          },
          body: input as unknown as BodyInit,
          duplex: "half",
        } as RequestInit,
        signal,
      );
      await response.body?.cancel();
    } finally {
      input.destroy();
    }
  }

  async download(
    path: string,
    localPath: string,
    signal: AbortSignal,
  ): Promise<void> {
    const response = await this.request(
      `/object/authenticated/${this.objectPath(path)}`,
      {},
      signal,
    );
    if (!response.body) throw new Error("Video storage returned no file");
    let bytes = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        callback(
          bytes > VIDEO_MAX_BYTES ? new Error("Video exceeds 30 MB") : null,
          chunk,
        );
      },
    });
    await pipeline(
      Readable.fromWeb(response.body as never),
      limit,
      createWriteStream(localPath),
      {
        signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
      },
    );
  }

  async remove(paths: string[], signal: AbortSignal): Promise<void> {
    const response = await this.request(
      `/object/${encodeURIComponent(this.config.supabaseVideoBucket!)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: paths }),
      },
      signal,
    );
    await response.body?.cancel();
  }

  async signedUrl(path: string): Promise<string> {
    const response = await this.request(
      `/object/sign/${this.objectPath(path)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: 3600 }),
      },
      AbortSignal.timeout(30_000),
    );
    const data = (await response.json()) as { signedURL?: string };
    if (!data.signedURL?.startsWith("/object/sign/"))
      throw new Error("Invalid storage signing response");
    return `${this.base}${data.signedURL}`;
  }
}

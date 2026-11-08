import { tmpdir } from "node:os";
import { join } from "node:path";

export const VIDEO_MAX_BYTES = 30 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 60;
export const VIDEO_LIMIT = 3;
export const VIDEO_QUEUE_LIMIT = 10;
export const VIDEO_UPLOAD_DIRECTORY = join(tmpdir(), "trainloop-video-uploads");
export const VIDEO_JOB_DIRECTORY = join(tmpdir(), "trainloop-video-jobs");
export const VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
// Separate keys for queue admission and the global encoder lock.
export const VIDEO_ADMISSION_LOCK = 74120701;
export const VIDEO_WORKER_LOCK = 74120702;
export const VIDEO_JOB_TIMEOUT_MS = 150_000;
export const VIDEO_TRANSACTION_TIMEOUT_MS = 180_000;

import { keyFromSelector } from "i18next";

import { messageSelectors } from "@/i18n/messages";

export const VIDEO_MAX_BYTES = 30 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 60;
export const VIDEO_LIMIT = 3;
export const VIDEO_ACCEPT = "video/*";

/** Read local metadata before any network upload, releasing the decoder and URL. */
export async function validateVideo(file: File): Promise<void> {
  if (file.size > VIDEO_MAX_BYTES) {
    throw new Error(keyFromSelector(messageSelectors.videoTooLarge));
  }
  if (
    !["video/mp4", "video/quicktime", "video/webm"].includes(file.type) &&
    !(file.type === "" && /\.(mp4|mov|webm)$/i.test(file.name))
  ) {
    throw new Error(keyFromSelector(messageSelectors.videoInvalid));
  }
  const video = document.createElement("video");
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const invalid = () =>
        reject(new Error(keyFromSelector(messageSelectors.videoInvalid)));
      const timer = window.setTimeout(invalid, 15_000);
      const finish = (error?: Error) => {
        window.clearTimeout(timer);
        if (error) reject(error);
        else resolve();
      };
      video.onloadedmetadata = () => {
        if (
          !Number.isFinite(video.duration) ||
          video.duration <= 0 ||
          !video.videoWidth ||
          !video.videoHeight
        ) {
          finish(new Error(keyFromSelector(messageSelectors.videoInvalid)));
        } else if (video.duration > VIDEO_MAX_SECONDS) {
          finish(new Error(keyFromSelector(messageSelectors.videoTooLong)));
        } else finish();
      };
      video.onerror = () =>
        finish(new Error(keyFromSelector(messageSelectors.videoInvalid)));
      video.preload = "metadata";
      video.src = url;
    });
  } finally {
    video.onloadedmetadata = null;
    video.onerror = null;
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

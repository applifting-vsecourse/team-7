import { keyFromSelector } from "i18next";
import { z } from "zod";

import { messageSelectors } from "@/i18n/messages";

export const dogPhotoSchema = z
  .object({
    file: z.instanceof(File),
    position: z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    }),
    zoom: z.number().min(1).max(3),
  })
  .refine(
    ({ file }) =>
      file.size <= 5 * 1024 * 1024 &&
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    keyFromSelector(messageSelectors.dogPhotoInvalid),
  );

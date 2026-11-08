import { keyFromSelector } from "i18next";
import { z } from "zod";

import { messageSelectors } from "@/i18n/messages";

export const userSettingsSchema = z.object({
  emailNotificationsEnabled: z.boolean({
    error: keyFromSelector(messageSelectors.settingsInvalid),
  }),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

import { queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import {
  userSettingsSchema,
  type UserSettings,
} from "@/features/settings/schemas/userSettingsSchema";

export const userSettingsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["userSettings", userId],
    queryFn: async ({ signal }) =>
      userSettingsSchema.parse(
        await api.get("users/me/settings", { signal }).json(),
      ),
  });

export async function updateUserSettings(settings: UserSettings) {
  return userSettingsSchema.parse(
    await api.patch("users/me/settings", { json: settings }).json(),
  );
}

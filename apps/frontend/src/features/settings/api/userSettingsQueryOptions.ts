import { queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import { authClient } from "@/features/auth/lib/auth-client";
import { accountSummarySchema } from "@/features/settings/schemas/accountSettingsSchema";
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

export const userAccountsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["userAccounts", userId],
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts();
      if (error || !data) throw new Error("Account loading failed");
      return data;
    },
  });

export const accountSummaryQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["accountSummary", userId],
    queryFn: async ({ signal }) =>
      accountSummarySchema.parse(
        await api.get("users/me/settings/summary", { signal }).json(),
      ),
  });

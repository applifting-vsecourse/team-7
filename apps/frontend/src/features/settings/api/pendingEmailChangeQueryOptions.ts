import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";

const pendingEmailChangeSchema = z.object({
  pendingEmailChange: z
    .object({
      id: z.string(),
      email: z.string().email(),
      expiresAt: z.string().datetime(),
    })
    .nullable(),
});

export const pendingEmailChangeQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["pendingEmailChange", userId],
    queryFn: async ({ signal }) =>
      pendingEmailChangeSchema.parse(
        await api.get("users/me/settings/email-change", { signal }).json(),
      ),
  });

export async function cancelPendingEmailChange(id: string) {
  await api.delete(`users/me/settings/email-change/${encodeURIComponent(id)}`);
}

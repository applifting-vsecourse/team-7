import type { Dog } from "./dogsQueryOptions";

import { apiUrl } from "@/lib/api-url";

export function dogAvatarUrl({ id, avatarVersion }: Dog): string | undefined {
  if (!avatarVersion) return undefined;
  const url = apiUrl(`dogs/${encodeURIComponent(id)}/avatar`);
  url.searchParams.set("v", avatarVersion);
  return url.href;
}

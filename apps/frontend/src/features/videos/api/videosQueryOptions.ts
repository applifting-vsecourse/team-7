import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";

export const videoSchema = z.object({
  id: z.string(),
  status: z.enum([
    "uploading",
    "pending",
    "processing",
    "completed",
    "failed",
    "deleting",
  ]),
  duration: z.number().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ExerciseVideo = z.infer<typeof videoSchema>;
export const videosPath = (dogId: string, sessionId: string) =>
  `dogs/${encodeURIComponent(dogId)}/sessions/${encodeURIComponent(sessionId)}/videos`;
export const videosQueryOptions = (
  userId: string | undefined,
  dogId: string,
  sessionId: string,
) =>
  queryOptions({
    queryKey: ["sessionVideos", userId, dogId, sessionId],
    enabled: Boolean(userId),
    queryFn: async ({ signal }) =>
      z
        .array(videoSchema)
        .parse(await api.get(videosPath(dogId, sessionId), { signal }).json()),
    refetchInterval: (query) =>
      query.state.data?.some((video) =>
        ["uploading", "pending", "processing"].includes(video.status),
      )
        ? 5_000
        : false,
  });

export const playbackQueryOptions = (
  userId: string | undefined,
  dogId: string,
  sessionId: string,
  videoId: string,
) =>
  queryOptions({
    queryKey: ["videoPlayback", userId, dogId, sessionId, videoId],
    enabled: Boolean(userId),
    queryFn: async ({ signal }) =>
      z
        .object({ url: z.url(), expiresIn: z.number() })
        .parse(
          await api
            .get(
              `${videosPath(dogId, sessionId)}/${encodeURIComponent(videoId)}/playback`,
              { signal },
            )
            .json(),
        ),
    // Signed URLs last an hour. Refresh well before they expire.
    staleTime: 30 * 60 * 1000,
    gcTime: 0,
  });

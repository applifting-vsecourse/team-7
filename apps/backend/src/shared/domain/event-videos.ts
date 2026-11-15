import type { Prisma } from "@/generated/prisma/client";
import { withPaused } from "./exercise-status";

/**
 * Sessions with a video to watch (Figma Event `Show video`), scoped like the
 * session's video list. Failed uploads and videos being deleted don't count;
 * ones still processing do, since they become playable on their own.
 */
async function sessionsWithVideo(
  prisma: Prisma.TransactionClient,
  userId: string,
  events: { id: string; dogId: string }[],
) {
  if (!events.length) return new Set<string>();
  const videos = await prisma.video.findMany({
    where: {
      userId,
      sessionId: { in: events.map(({ id }) => id) },
      status: { notIn: ["failed", "deleting"] },
    },
    select: { sessionId: true, dogId: true },
  });
  return new Set(videos.map(({ sessionId, dogId }) => `${sessionId}:${dogId}`));
}

/** What a calendar tile shows besides the training itself: paused, video. */
export async function withEventFlags<
  T extends { id: string; dogId: string; exerciseId: string | null },
>(prisma: Prisma.TransactionClient, userId: string, events: T[]) {
  const [paused, videos] = await Promise.all([
    withPaused(prisma, events),
    sessionsWithVideo(prisma, userId, events),
  ]);
  return paused.map((event) => ({
    ...event,
    hasVideo: videos.has(`${event.id}:${event.dogId}`),
  }));
}

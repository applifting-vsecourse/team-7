/* oxlint-disable jsx-a11y/media-has-caption -- User-uploaded clips have no caption tracks in the current API. */
import { useEffect, useId, useRef, useState } from "react";
import { Play, Video, Xmark } from "@gravity-ui/icons";
import { Button, Modal, Spinner } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { translateMessage } from "@/i18n/messages";
import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";
import { dogProfileKey } from "@/features/dogs/api/dogProfileQueryOptions";
import { eventsKey } from "@/features/events/api/eventsQueryOptions";
import { LockedFeature } from "@/features/subscription/components/LockedFeature";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";

import {
  type ExerciseVideo,
  playbackQueryOptions,
  videosPath,
  videosQueryOptions,
} from "../api/videosQueryOptions";
import { validateVideo, VIDEO_ACCEPT, VIDEO_LIMIT } from "../lib/videoUpload";

type ExerciseVideosProps = {
  dogId: string;
  sessionId: string;
  /** What the calendar tile currently shows (`ScheduledEvent.hasVideo`). */
  tileHasVideo: boolean;
  /** Training history: play only, no uploading or removing. */
  readOnly?: boolean;
  isDisabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
};
export function ExerciseVideos(props: ExerciseVideosProps) {
  const subscription = useSubscription();
  const { t } = useTranslation();
  // Until the plan is known, show the same loading/error states as the list,
  // so a paying user never sees the lock while the subscription loads.
  if (!subscription.data) {
    return (
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t(($) => $.videos.title)}</h3>
        {subscription.isError ? (
          <div
            role="alert"
            className="flex items-center gap-2 text-sm text-danger"
          >
            {t(($) => $.videos.loadError)}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onPress={() => void subscription.refetch()}
            >
              {t(($) => $.videos.retry)}
            </Button>
          </div>
        ) : (
          <p role="status" className="text-sm text-muted">
            {t(($) => $.videos.loading)}
          </p>
        )}
      </section>
    );
  }
  return <ExerciseVideoList {...props} locked={!subscription.data.isPlus} />;
}

/**
 * Without Plus (`locked`) the section shows the lock (Figma M3); videos saved
 * while on Plus stay listed and can be deleted, but not played or added.
 */
function ExerciseVideoList({
  dogId,
  sessionId,
  tileHasVideo,
  readOnly = false,
  isDisabled = false,
  onBusyChange,
  locked,
}: ExerciseVideosProps & { locked: boolean }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const client = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [phase, setPhase] = useState<"validating" | "uploading">("validating");
  const [playing, setPlaying] = useState<string | null>(null);
  const options = videosQueryOptions(user?.id, dogId, sessionId);
  const videos = useQuery(options);
  const refresh = () =>
    client.invalidateQueries({ queryKey: options.queryKey });
  const upload = useMutation({
    mutationFn: async (file: File) => {
      setPhase("validating");
      await validateVideo(file);
      setPhase("uploading");
      const body = new FormData();
      body.set("file", file);
      // Upload progress in ky requires streaming requests, which fail on local
      // HTTP/1.1 servers. Show an indeterminate state on every supported browser.
      await api.post(videosPath(dogId, sessionId), { body, timeout: 120_000 });
    },
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: async (videoId: string) => {
      await api.delete(
        `${videosPath(dogId, sessionId)}/${encodeURIComponent(videoId)}`,
      );
    },
    onSuccess: refresh,
  });
  // Tiles show whether a training has a video. Refresh them whenever this
  // list disagrees: after an upload or removal, when processing fails, or when
  // it failed while the dialog was closed.
  const hasVideo = videos.data?.some(
    (video) => !["failed", "deleting"].includes(video.status),
  );
  // Cached data shown while the list refetches may be older than the tile.
  const isFresh = videos.isFetchedAfterMount && !videos.isFetching;
  useEffect(() => {
    if (!isFresh || hasVideo === undefined || hasVideo === tileHasVideo) return;
    void client.invalidateQueries({ queryKey: eventsKey(user?.id) });
    void client.invalidateQueries({ queryKey: dogProfileKey(user?.id) });
  }, [client, hasVideo, isFresh, tileHasVideo, user?.id]);
  const busy = upload.isPending || remove.isPending;
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  // History has nothing to do about a failed upload, so it lists none.
  const items =
    videos.data?.filter(
      (video) =>
        video.status !== "deleting" && !(readOnly && video.status === "failed"),
    ) ?? [];
  const atLimit = items.length >= VIDEO_LIMIT;
  const disabled = isDisabled || busy;
  // History can't add videos, so an empty list (its only video failed while
  // the tile still said "Video") has nothing to show until the tile refreshes.
  if (readOnly && videos.isSuccess && items.length === 0 && !locked) {
    return null;
  }
  const canAdd = !readOnly && !locked;
  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-2">
      <h3 id={`${id}-heading`} className="text-sm font-medium">
        {t(($) => $.videos.title)}
      </h3>
      {locked && (
        <LockedFeature
          reason="videos"
          title={t(($) => $.limits.videosTitle)}
          description={t(($) => $.limits.videosDescription)}
        />
      )}
      {videos.isPending && (
        <p role="status" className="text-sm text-muted">
          {t(($) => $.videos.loading)}
        </p>
      )}
      {videos.isError && (
        <div
          role="alert"
          className="flex items-center gap-2 text-sm text-danger"
        >
          {t(($) => $.videos.loadError)}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={() => void videos.refetch()}
          >
            {t(($) => $.videos.retry)}
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-start gap-2">
        {items.map((video, index) => (
          <VideoTile
            key={video.id}
            video={video}
            number={index + 1}
            userId={user?.id}
            dogId={dogId}
            sessionId={sessionId}
            isDisabled={disabled}
            isRemoving={remove.isPending && remove.variables === video.id}
            canPlay={!locked}
            onPlay={() => setPlaying(video.id)}
            onRemove={readOnly ? undefined : () => remove.mutate(video.id)}
          />
        ))}
        {upload.isPending && (
          <div
            role="status"
            className="flex h-18 w-32 flex-col items-center justify-center gap-1 rounded-xl bg-default text-center text-xs"
          >
            <Spinner size="sm" />
            {phase === "validating"
              ? t(($) => $.videos.validating)
              : t(($) => $.videos.uploading)}
          </div>
        )}
        {canAdd && (
          <input
            ref={input}
            id={id}
            type="file"
            accept={VIDEO_ACCEPT}
            className="hidden"
            aria-label={t(($) => $.videos.upload)}
            disabled={disabled || atLimit || !videos.isSuccess || !user}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file && !disabled && !atLimit && videos.isSuccess) {
                upload.mutate(file);
              }
            }}
          />
        )}
        {canAdd && !atLimit && (
          <Button
            type="button"
            variant="outline"
            className="h-18 w-32 flex-col gap-1"
            isDisabled={disabled || !videos.isSuccess || !user}
            aria-describedby={`${id}-hint`}
            onPress={() => input.current?.click()}
          >
            <Video className="size-5" aria-hidden="true" />
            {t(($) => $.videos.upload)}
          </Button>
        )}
      </div>
      {canAdd && (
        <p id={`${id}-hint`} className="text-xs leading-5 text-muted">
          {atLimit ? t(($) => $.videos.limit) : t(($) => $.videos.hint)}
        </p>
      )}
      {locked && !readOnly && items.length > 0 && (
        <p className="text-xs leading-5 text-muted">
          {t(($) => $.limits.videosStored)}
        </p>
      )}
      {upload.isError && (
        <p role="alert" className="text-sm text-danger">
          {upload.error.message.startsWith("videos.")
            ? translateMessage(t, upload.error.message)
            : t(($) => $.videos.uploadError)}
        </p>
      )}
      {remove.isError && (
        <p role="alert" className="text-sm text-danger">
          {t(($) => $.videos.removeError)}
        </p>
      )}
      {playing && (
        <VideoPlayer
          userId={user?.id}
          dogId={dogId}
          sessionId={sessionId}
          videoId={playing}
          onClose={() => setPlaying(null)}
        />
      )}
    </section>
  );
}

function VideoTile({
  video,
  number,
  userId,
  dogId,
  sessionId,
  isDisabled,
  isRemoving,
  canPlay,
  onPlay,
  onRemove,
}: {
  video: ExerciseVideo;
  number: number;
  userId: string | undefined;
  dogId: string;
  sessionId: string;
  isDisabled: boolean;
  isRemoving: boolean;
  canPlay: boolean;
  onPlay: () => void;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  const completed = video.status === "completed";
  // Without Plus a saved video shows as a plain tile: no thumbnail, no play.
  const playable = completed && canPlay;
  const failed = video.status === "failed";
  const playback = useQuery({
    ...playbackQueryOptions(userId, dogId, sessionId, video.id),
    enabled: Boolean(userId) && playable,
  });
  const seconds = Math.floor(video.duration ?? 0);
  return (
    <div className="flex w-32 flex-col gap-1">
      <div className="relative h-18">
        <Button
          type="button"
          variant="secondary"
          className="relative h-18 w-32 overflow-hidden"
          isDisabled={isDisabled || !playable}
          aria-label={t(($) => $.videos.play, { number })}
          onPress={onPlay}
        >
          {playback.data && (
            <video
              src={`${playback.data.url}#t=0.001`}
              preload="metadata"
              muted
              playsInline
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full object-cover"
            />
          )}
          {playable ? (
            <Play
              className="relative size-8 rounded-full bg-background/90 p-2"
              aria-hidden="true"
            />
          ) : failed || completed ? (
            <Video className="size-5" aria-hidden="true" />
          ) : (
            <Spinner size="sm" />
          )}
          {completed && video.duration !== null && (
            <span className="absolute right-1 bottom-1 rounded bg-background/90 px-1 text-xs">
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
          )}
        </Button>
        {onRemove && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isIconOnly
            className="absolute top-1 right-1 size-6 min-w-6"
            aria-label={t(($) => $.videos.remove, { number })}
            isDisabled={isDisabled}
            isPending={isRemoving}
            onPress={onRemove}
          >
            <Xmark className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      {!completed && (
        <p
          role="status"
          className={failed ? "text-xs text-danger" : "text-xs text-muted"}
        >
          {failed
            ? video.error === "invalidVideo"
              ? t(($) => $.videos.invalid)
              : t(($) => $.videos.failed)
            : video.status === "uploading"
              ? t(($) => $.videos.uploading)
              : t(($) => $.videos.processing)}
        </p>
      )}
    </div>
  );
}

function VideoPlayer({
  userId,
  dogId,
  sessionId,
  videoId,
  onClose,
}: {
  userId: string | undefined;
  dogId: string;
  sessionId: string;
  videoId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [mediaError, setMediaError] = useState(false);
  const playback = useQuery({
    ...playbackQueryOptions(userId, dogId, sessionId, videoId),
    staleTime: 0,
  });
  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Container size="lg" scroll="outside">
        <Modal.Dialog
          className="overflow-hidden bg-background p-0"
          aria-label={t(($) => $.videos.player)}
        >
          <Modal.CloseTrigger aria-label={t(($) => $.videos.close)} />
          <Modal.Body className="m-0 p-0">
            {playback.isPending && (
              <p role="status" className="p-6">
                {t(($) => $.videos.loading)}
              </p>
            )}
            {playback.isError || mediaError ? (
              <div role="alert" className="flex flex-col gap-2 p-6">
                <p className="text-sm text-danger">
                  {t(($) => $.videos.playbackError)}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onPress={() => {
                    setMediaError(false);
                    void playback.refetch();
                  }}
                >
                  {t(($) => $.videos.retry)}
                </Button>
              </div>
            ) : (
              playback.data && (
                <video
                  key={playback.data.url}
                  src={playback.data.url}
                  controls
                  playsInline
                  className="block aspect-video w-full"
                  aria-label={t(($) => $.videos.player)}
                  onError={() => setMediaError(true)}
                />
              )
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

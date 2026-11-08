/* oxlint-disable jsx-a11y/media-has-caption -- User-uploaded clips have no caption tracks in the current API. */
import { useEffect, useId, useRef, useState } from "react";
import { Play, Video, Xmark } from "@gravity-ui/icons";
import { Button, Modal, Spinner } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { translateMessage } from "@/i18n/messages";
import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";

import {
  type ExerciseVideo,
  playbackQueryOptions,
  videosPath,
  videosQueryOptions,
} from "../api/videosQueryOptions";
import { validateVideo, VIDEO_ACCEPT, VIDEO_LIMIT } from "../lib/videoUpload";

export function ExerciseVideos({
  dogId,
  exerciseId,
  isDisabled = false,
  onBusyChange,
}: {
  dogId: string;
  exerciseId: string;
  isDisabled?: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const { t } = useTranslation();
  const { user } = useSession();
  const client = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [phase, setPhase] = useState<"validating" | "uploading">("validating");
  const [playing, setPlaying] = useState<string | null>(null);
  const options = videosQueryOptions(user?.id, dogId, exerciseId);
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
      await api.post(videosPath(dogId, exerciseId), { body, timeout: 120_000 });
    },
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: async (videoId: string) => {
      await api.delete(
        `${videosPath(dogId, exerciseId)}/${encodeURIComponent(videoId)}`,
      );
    },
    onSuccess: refresh,
  });
  const busy = upload.isPending || remove.isPending;
  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);
  const items =
    videos.data?.filter((video) => video.status !== "deleting") ?? [];
  const atLimit = items.length >= VIDEO_LIMIT;
  const disabled = isDisabled || busy;
  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-2">
      <h3 id={`${id}-heading`} className="text-sm font-medium">
        {t(($) => $.videos.title)}
      </h3>
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
            exerciseId={exerciseId}
            isDisabled={disabled}
            isRemoving={remove.isPending && remove.variables === video.id}
            onPlay={() => setPlaying(video.id)}
            onRemove={() => remove.mutate(video.id)}
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
        <Button
          type="button"
          variant="outline"
          className="h-18 w-32 flex-col gap-1"
          isDisabled={disabled || atLimit || !videos.isSuccess || !user}
          aria-describedby={`${id}-hint`}
          onPress={() => input.current?.click()}
        >
          <Video className="size-5" aria-hidden="true" />
          {t(($) => $.videos.upload)}
        </Button>
      </div>
      <p id={`${id}-hint`} className="text-xs leading-5 text-muted">
        {atLimit ? t(($) => $.videos.limit) : t(($) => $.videos.hint)}
      </p>
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
          exerciseId={exerciseId}
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
  exerciseId,
  isDisabled,
  isRemoving,
  onPlay,
  onRemove,
}: {
  video: ExerciseVideo;
  number: number;
  userId: string | undefined;
  dogId: string;
  exerciseId: string;
  isDisabled: boolean;
  isRemoving: boolean;
  onPlay: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const completed = video.status === "completed";
  const failed = video.status === "failed";
  const playback = useQuery({
    ...playbackQueryOptions(userId, dogId, exerciseId, video.id),
    enabled: Boolean(userId) && completed,
  });
  const seconds = Math.floor(video.duration ?? 0);
  return (
    <div className="flex w-32 flex-col gap-1">
      <div className="relative h-18">
        <Button
          type="button"
          variant="secondary"
          className="relative h-18 w-32 overflow-hidden"
          isDisabled={isDisabled || !completed}
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
          {completed ? (
            <Play
              className="relative size-8 rounded-full bg-background/90 p-2"
              aria-hidden="true"
            />
          ) : failed ? (
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
  exerciseId,
  videoId,
  onClose,
}: {
  userId: string | undefined;
  dogId: string;
  exerciseId: string;
  videoId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [mediaError, setMediaError] = useState(false);
  const playback = useQuery({
    ...playbackQueryOptions(userId, dogId, exerciseId, videoId),
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

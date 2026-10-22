import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { Label, Slider } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { dogPhotoCrop, drawDogPhoto, type DogPhoto } from "../api/dogPhotos";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function DogPhotoCanvas({
  photo,
  onChange,
  onError,
  isDisabled,
}: {
  photo: DogPhoto;
  onChange: (photo: DogPhoto) => void;
  onError: () => void;
  isDisabled: boolean;
}) {
  const { t } = useTranslation();
  const hintId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState<{
    file: File;
    image: HTMLImageElement;
  }>();
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    photo: DogPhoto;
  } | null>(null);
  const reportError = useEffectEvent(onError);
  const file = photo.file;
  const image = loaded?.file === file ? loaded.image : undefined;

  useEffect(() => {
    let active = true;
    const url = URL.createObjectURL(file);
    const source = new Image();
    Promise.resolve()
      .then(async () => {
        if (!active) return;
        source.src = url;
        await source.decode();
      })
      .then(() => {
        if (!active) return;
        if (!source.naturalWidth || !source.naturalHeight) {
          reportError();
          return;
        }
        setLoaded({ file, image: source });
      })
      .catch(() => {
        if (active) reportError();
      });
    return () => {
      active = false;
      source.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext("2d");
    if (!context) {
      reportError();
      return;
    }
    drawDogPhoto(context, image, photo, canvas.width);
  }, [image, photo]);

  function endDrag(event: PointerEvent<HTMLCanvasElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className="mt-1 flex flex-col gap-2">
      {/* The crop editor needs application interaction so arrow keys reach the canvas. */}
      {/* oxlint-disable jsx-a11y/no-interactive-element-to-noninteractive-role */}
      <canvas
        ref={canvasRef}
        width={512}
        height={512}
        role="application"
        aria-label={t(($) => $.dogs.photoPreview)}
        aria-describedby={hintId}
        aria-disabled={isDisabled}
        aria-busy={!image}
        tabIndex={isDisabled ? -1 : 0}
        className="aspect-square h-auto w-full cursor-grab touch-none rounded-2xl bg-surface-secondary outline-offset-4 active:cursor-grabbing aria-disabled:cursor-default"
        onPointerDown={(event) => {
          if (isDisabled || !image || event.button !== 0 || drag.current) {
            return;
          }
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            photo,
          };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (isDisabled || !image || !start || start.id !== event.pointerId) {
            return;
          }
          const bounds = event.currentTarget.getBoundingClientRect();
          if (!bounds.width || !bounds.height) return;
          const { size } = dogPhotoCrop(image, start.photo);
          const availableX = image.naturalWidth - size;
          const availableY = image.naturalHeight - size;
          onChange({
            ...start.photo,
            position: {
              x: availableX
                ? clamp(
                    start.photo.position.x -
                      ((event.clientX - start.x) * size) /
                        bounds.width /
                        availableX,
                  )
                : 0.5,
              y: availableY
                ? clamp(
                    start.photo.position.y -
                      ((event.clientY - start.y) * size) /
                        bounds.height /
                        availableY,
                  )
                : 0.5,
            },
          });
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={(event) => {
          if (drag.current?.id === event.pointerId) drag.current = null;
        }}
        onKeyDown={(event) => {
          if (isDisabled || !image) return;
          const step = event.shiftKey ? 0.1 : 0.02;
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [step, 0],
            ArrowRight: [-step, 0],
            ArrowUp: [0, step],
            ArrowDown: [0, -step],
          };
          const move = moves[event.key];
          if (!move) return;
          event.preventDefault();
          onChange({
            ...photo,
            position: {
              x: clamp(photo.position.x + move[0]),
              y: clamp(photo.position.y + move[1]),
            },
          });
        }}
      />
      {/* oxlint-enable jsx-a11y/no-interactive-element-to-noninteractive-role */}
      <Slider
        minValue={1}
        maxValue={3}
        step={0.05}
        value={photo.zoom}
        formatOptions={{ style: "percent" }}
        isDisabled={isDisabled || !image}
        onChange={(value) => {
          if (!image) return;
          const zoom = Number(value);
          const crop = dogPhotoCrop(image, photo);
          const size = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
          const availableX = image.naturalWidth - size;
          const availableY = image.naturalHeight - size;
          onChange({
            ...photo,
            zoom,
            position: {
              x: availableX
                ? clamp((crop.left + (crop.size - size) / 2) / availableX)
                : 0.5,
              y: availableY
                ? clamp((crop.top + (crop.size - size) / 2) / availableY)
                : 0.5,
            },
          });
        }}
      >
        <Label>{t(($) => $.dogs.photoZoom)}</Label>
        <Slider.Output />
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      <p id={hintId} className="text-xs leading-5 text-muted">
        {t(($) => $.dogs.photoMoveHint)}
      </p>
    </div>
  );
}

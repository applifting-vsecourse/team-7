import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent,
  type Ref,
} from "react";
import type { DogPhoto } from "../api/dogPhotos";
import { CloudArrowUpIn, Picture, Xmark } from "@gravity-ui/icons";
import { Button, Label } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { dogPhotoSchema } from "../schemas/dogPhotoSchema";
import { DogPhotoCanvas } from "./DogPhotoCanvas";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

export function DogPhotoPicker({
  value,
  onChange,
  onErrorChange,
  isDisabled = false,
  inputRef,
  name,
  onBlur,
  errorMessage,
}: {
  value: DogPhoto | null;
  onChange: (photo: DogPhoto | null) => void;
  onErrorChange?: (error: boolean) => void;
  inputRef?: Ref<HTMLInputElement>;
  name?: string;
  onBlur?: () => void;
  errorMessage?: string;
  isDisabled?: boolean;
}) {
  const { t } = useTranslation();
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  useImperativeHandle(inputRef, () => fileInput.current!, []);

  useEffect(() => {
    if (!value && fileInput.current) fileInput.current.value = "";
  }, [value]);

  const select = (file: File) => {
    const photo = { file, position: { x: 0.5, y: 0.5 }, zoom: 1 };
    const invalid = !dogPhotoSchema.safeParse(photo).success;
    setError(invalid);
    onErrorChange?.(invalid);
    onChange(photo);
  };

  const clear = () => {
    if (fileInput.current) fileInput.current.value = "";
    onChange(null);
    setError(false);
    onErrorChange?.(false);
  };

  const dropHandlers = {
    onDragOver: (event: DragEvent) => {
      if (isDisabled) return;
      event.preventDefault();
      setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const dropped = event.dataTransfer.files[0];
      if (!isDisabled && dropped) select(dropped);
    },
  };

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{t(($) => $.dogs.photo)}</Label>
      {/* The native input stays focusable and labelled for assistive tech and
          keyboards; the browser's own button can't be localized or styled. */}
      <input
        id={id}
        ref={fileInput}
        className="peer sr-only"
        name={name}
        onBlur={onBlur}
        type="file"
        accept={ACCEPTED_TYPES}
        disabled={isDisabled}
        aria-describedby={`${id}-hint${error || errorMessage ? ` ${id}-error` : ""}`}
        aria-invalid={error || Boolean(errorMessage)}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) select(selected);
        }}
      />
      {value ? (
        <div
          {...dropHandlers}
          className={cn(
            "flex min-w-0 items-center gap-2 rounded-2xl bg-surface py-1 pr-1 pl-3 shadow-field peer-focus-visible:focus-ring",
            isDragging && "bg-accent-soft",
          )}
        >
          <Picture className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm">
            {value.file.name}
          </span>
          {/* Clicking a label opens the picker; it repeats the input's name, so
              assistive tech skips it in favour of the input itself. */}
          <label
            htmlFor={id}
            aria-hidden="true"
            className={cn(
              "shrink-0 cursor-pointer rounded-2xl px-3 py-1.5 text-sm font-medium hover:bg-default",
              isDisabled && "pointer-events-none opacity-50",
            )}
          >
            {t(($) => $.dogs.changePhoto)}
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={t(($) => $.dogs.clearPhoto)}
            isDisabled={isDisabled}
            onPress={clear}
          >
            <Xmark aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          aria-hidden="true"
          {...dropHandlers}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed border-border bg-surface px-4 py-8 text-center transition-colors peer-focus-visible:focus-ring hover:bg-surface-secondary",
            isDragging && "border-accent bg-accent-soft",
            isDisabled && "pointer-events-none opacity-50",
            (error || errorMessage) && "border-danger",
          )}
        >
          <CloudArrowUpIn className="size-8 text-muted" aria-hidden="true" />
          <span className="text-sm font-medium text-accent">
            {t(($) => $.dogs.choosePhoto)}
          </span>
          <span className="text-sm text-muted">
            {t(($) => $.dogs.dropPhoto)}
          </span>
        </label>
      )}
      {/* With a photo picked, the crop editor's own hint takes over. */}
      <p
        id={`${id}-hint`}
        className={cn("text-xs leading-5 text-muted", value && "sr-only")}
      >
        {t(($) => $.dogs.photoHint)}
      </p>
      {error || errorMessage ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs leading-5 text-danger"
        >
          {errorMessage ?? t(($) => $.dogs.photoInvalid)}
        </p>
      ) : null}
      {value && dogPhotoSchema.safeParse(value).success ? (
        <DogPhotoCanvas
          photo={value}
          onChange={onChange}
          isDisabled={isDisabled}
          onError={() => {
            setError(true);
            onErrorChange?.(true);
          }}
        />
      ) : null}
    </div>
  );
}

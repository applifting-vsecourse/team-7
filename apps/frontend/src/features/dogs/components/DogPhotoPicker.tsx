import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import type { DogPhoto } from "../api/dogPhotos";
import { Xmark } from "@gravity-ui/icons";
import { Button, Input, Label } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { dogPhotoSchema } from "../schemas/dogPhotoSchema";
import { DogPhotoCanvas } from "./DogPhotoCanvas";

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
  useImperativeHandle(inputRef, () => fileInput.current!, []);

  useEffect(() => {
    if (!value && fileInput.current) fileInput.current.value = "";
  }, [value]);

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={id}>{t(($) => $.dogs.photo)}</Label>
      <div className="relative">
        <Input
          id={id}
          ref={fileInput}
          className="w-full min-w-0 pr-12"
          name={name}
          onBlur={onBlur}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isDisabled}
          aria-describedby={`${id}-hint${error || errorMessage ? ` ${id}-error` : ""}`}
          aria-invalid={error || Boolean(errorMessage)}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (!selected) return;
            const photo = {
              file: selected,
              position: { x: 0.5, y: 0.5 },
              zoom: 1,
            };
            const invalid = !dogPhotoSchema.safeParse(photo).success;
            setError(invalid);
            onErrorChange?.(invalid);
            onChange(photo);
          }}
        />
        {value || error ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={t(($) => $.dogs.clearPhoto)}
            className="absolute top-1/2 right-1 -translate-y-1/2"
            isDisabled={isDisabled}
            onPress={() => {
              if (fileInput.current) fileInput.current.value = "";
              onChange(null);
              setError(false);
              onErrorChange?.(false);
            }}
          >
            <Xmark aria-hidden="true" className="size-4" />
          </Button>
        ) : null}
      </div>
      <p id={`${id}-hint`} className="text-sm text-muted">
        {t(($) => $.dogs.photoHint)}
      </p>
      {error || errorMessage ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
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

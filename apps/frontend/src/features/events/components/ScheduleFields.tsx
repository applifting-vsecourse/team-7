import type { ScheduleValues } from "../schemas/scheduleSchema";
import {
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import { Controller, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { translateMessage } from "@/i18n/messages";
import { cn } from "@/lib/utils";

/** Date, start and duration shared by planning and rescheduling. */
export function ScheduleFields({
  control,
  index,
  isDisabled,
  minDate,
}: {
  control: Control<ScheduleValues>;
  index: number;
  isDisabled: boolean;
  minDate?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 md:grid-cols-3">
      {(["date", "time"] as const).map((kind) => (
        <Controller
          key={kind}
          control={control}
          name={`exercises.${index}.${kind}`}
          render={({ field, fieldState }) => (
            <TextField
              isDisabled={isDisabled}
              isInvalid={fieldState.invalid}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              type={kind}
              className={cn(
                "min-w-0",
                kind === "date" && "col-span-2 md:col-span-1",
              )}
            >
              <Label>
                {kind === "date"
                  ? t(($) => $.planning.date)
                  : t(($) => $.planning.time)}
              </Label>
              <Input
                ref={field.ref}
                min={kind === "date" ? minDate : undefined}
                className="w-full min-w-0"
              />
              <FieldError>
                {fieldState.error &&
                  translateMessage(t, fieldState.error.message!)}
              </FieldError>
            </TextField>
          )}
        />
      ))}
      <Controller
        control={control}
        name={`exercises.${index}.durationMinutes`}
        render={({ field, fieldState }) => (
          <Select
            isDisabled={isDisabled}
            isInvalid={fieldState.invalid}
            name={field.name}
            value={String(field.value)}
            onChange={(value) => field.onChange(Number(value))}
            onBlur={field.onBlur}
          >
            <Label>{t(($) => $.planning.duration)}</Label>
            <Select.Trigger ref={field.ref}>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {[...new Set([5, 10, 15, 20, 30, 45, 60, 90, 120, field.value])]
                  .sort((a, b) => a - b)
                  .map((minutes) => (
                    <ListBox.Item
                      key={minutes}
                      id={String(minutes)}
                      textValue={t(($) => $.planning.minutes, {
                        count: minutes,
                      })}
                    >
                      {t(($) => $.planning.minutes, { count: minutes })}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
              </ListBox>
            </Select.Popover>
            <FieldError>
              {fieldState.error &&
                translateMessage(t, fieldState.error.message!)}
            </FieldError>
          </Select>
        )}
      />
    </div>
  );
}

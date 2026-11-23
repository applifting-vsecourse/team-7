import { useRef } from "react";
import type { DisciplineItem } from "../hooks/useDisciplineGroups";
import { ChevronRight, Flag, ListUl, Plus } from "@gravity-ui/icons";
import { Alert, Button, Separator } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { openMorph, reopenedMorph } from "@/lib/motion";
import { pluralForm } from "@/lib/plural";

import type { Dog } from "@/features/dogs/api/dogsQueryOptions";
import { DogAvatar } from "@/features/dogs/components/DogAvatar";

// Stretches the title over the card so the whole card opens the detail;
// the "Add to a dog" button sits above it.
const STRETCH =
  "block w-full cursor-pointer text-start outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:focus-ring";

/**
 * A discipline on the disciplines page, the library card with the dogs that
 * train it and a quick "Add to a dog" while some dog doesn't. The title
 * opens the detail (a ready-made discipline is copied first).
 */
export function DisciplineTile({
  item,
  dogs,
  freeDogs,
  isBusy,
  onOpen,
  onAddToDog,
}: {
  item: DisciplineItem;
  /** The handler's dogs, for the avatars of those that train it. */
  dogs: Dog[];
  freeDogs: Dog[];
  isBusy: boolean;
  /** A ready-made discipline without a copy yet. */
  onOpen: () => void;
  onAddToDog: () => void;
}) {
  const { t } = useTranslation();
  const titleRef = useRef<HTMLSpanElement>(null);
  const isEmpty = item.goalCount === 0;
  const title = (
    // Morphs into the detail heading; inline-block keeps the box to the text.
    <span
      ref={titleRef}
      className="inline-block"
      style={item.id ? reopenedMorph("discipline", item.id) : undefined}
    >
      {item.name}
    </span>
  );

  return (
    <div className="relative flex min-w-0 flex-1 interactive-lift flex-col gap-3 rounded-2xl bg-background p-4 text-foreground shadow-card">
      {/* Grows so the footer lines up across cards in a row. */}
      <div className="flex flex-1 items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-xl leading-7 font-semibold tracking-tight">
            {item.id ? (
              <Link
                to={ROUTES.discipline}
                params={{ disciplineId: item.id }}
                onClick={() =>
                  openMorph(titleRef.current, "discipline", item.id!)
                }
                className={STRETCH}
              >
                {title}
              </Link>
            ) : (
              <button
                type="button"
                disabled={isBusy}
                onClick={onOpen}
                className={STRETCH}
              >
                {title}
              </button>
            )}
          </h3>
          {item.description ? (
            <p className="line-clamp-3 text-sm leading-6">{item.description}</p>
          ) : null}
        </div>
        <ChevronRight
          className="size-4 shrink-0 hover-nudge text-accent"
          aria-hidden="true"
        />
      </div>
      {item.dogs.length > 0 ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {item.dogs.map((ref) => {
            const dog = dogs.find((candidate) => candidate.id === ref.id);
            return (
              <li
                key={ref.id}
                className="flex min-w-0 items-center gap-1.5 text-sm leading-6"
              >
                {dog && <DogAvatar dog={dog} className="size-6" />}
                <span className="truncate">{ref.name}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      <Separator />
      {item.id && isEmpty ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t(($) => $.disciplines.emptyDiscipline)}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm leading-6">
          <span className="flex items-center gap-1">
            <Flag className="size-4 shrink-0 text-warning" aria-hidden="true" />
            {t(($) => $.disciplines.goalCount[pluralForm(item.goalCount)], {
              count: item.goalCount,
            })}
          </span>
          <span className="flex items-center gap-1">
            <ListUl
              className="size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            {t(
              ($) =>
                $.disciplines.exerciseCount[pluralForm(item.exerciseCount)],
              { count: item.exerciseCount },
            )}
          </span>
          {freeDogs.length > 0 && (
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={isBusy}
              className="relative z-1 ms-auto"
              aria-label={t(($) => $.disciplines.addToDogFor, {
                name: item.name,
              })}
              onPress={onAddToDog}
            >
              <Plus className="size-3.5 shrink-0" aria-hidden="true" />
              {t(($) => $.disciplines.addToDog)}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

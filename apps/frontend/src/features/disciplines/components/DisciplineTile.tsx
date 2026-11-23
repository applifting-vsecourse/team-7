import { useRef } from "react";
import type { DisciplineItem } from "../hooks/useDisciplineGroups";
import { ChevronRight, Plus } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { openMorph, reopenedMorph } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { Dog } from "@/features/dogs/api/dogsQueryOptions";
import { useGoalsSummary } from "@/features/dogs/components/AssignDisciplineDialog";
import { DogAvatar } from "@/features/dogs/components/DogAvatar";

// Stretches the title over the card so the whole card opens the detail; the
// "Add to a dog" button sits above it.
const STRETCH =
  "outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:focus-ring";

/**
 * A discipline on the disciplines page: a card when a dog trains it, a
 * dashed outline when none does. The title opens the detail (a ready-made
 * one is copied first); "Add to a dog" stays while some dog doesn't train it.
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
  const summary = useGoalsSummary();
  const titleRef = useRef<HTMLSpanElement>(null);
  const isTrained = item.dogs.length > 0;
  const isEmpty = Boolean(item.id) && item.goalCount === 0;
  const title = (
    <span className="flex items-start gap-3">
      <span
        ref={titleRef}
        className="min-w-0 flex-1 text-lg leading-7 font-semibold tracking-tight"
        style={item.id ? reopenedMorph("discipline", item.id) : undefined}
      >
        {item.name}
      </span>
      <ChevronRight
        className={cn(
          "mt-1.5 size-4 shrink-0 hover-nudge",
          isTrained ? "text-accent" : "text-muted",
        )}
        aria-hidden="true"
      />
    </span>
  );

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-1 interactive-lift flex-col gap-3 rounded-2xl p-4 text-foreground",
        isTrained
          ? "bg-background shadow-card"
          : "border border-dashed border-border",
      )}
    >
      <h3>
        {item.id ? (
          <Link
            to={ROUTES.discipline}
            params={{ disciplineId: item.id }}
            onClick={() => openMorph(titleRef.current, "discipline", item.id!)}
            className={cn("block text-start", STRETCH)}
          >
            {title}
          </Link>
        ) : (
          <button
            type="button"
            disabled={isBusy}
            onClick={onOpen}
            className={cn("block w-full cursor-pointer text-start", STRETCH)}
          >
            {title}
          </button>
        )}
      </h3>
      <p className="text-sm leading-6 text-muted">
        {isEmpty
          ? t(($) => $.disciplines.emptyDiscipline)
          : summary(item.goalCount, item.exerciseCount)}
      </p>
      {(isTrained || (freeDogs.length > 0 && !isEmpty)) && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            isTrained && "border-t border-border pt-3",
          )}
        >
          {item.dogs.map((ref) => {
            const dog = dogs.find((candidate) => candidate.id === ref.id);
            return (
              <span
                key={ref.id}
                className="flex min-w-0 items-center gap-1.5 text-sm leading-6"
              >
                {dog && <DogAvatar dog={dog} className="size-6" />}
                <span className="truncate">{ref.name}</span>
              </span>
            );
          })}
          {freeDogs.length > 0 && !isEmpty && (
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={isBusy}
              className={cn("relative z-1", isTrained && "ms-auto")}
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

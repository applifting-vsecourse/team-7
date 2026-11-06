import { useState } from "react";
import type { NeglectedDiscipline } from "../api/overviewQueryOptions";
import { ChevronDown } from "@gravity-ui/icons";
import { Alert, Button, CloseButton } from "@heroui/react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { PresenceItem, PresenceList } from "@/components/PresenceList";
import { pluralForm } from "@/lib/plural";
import { cn } from "@/lib/utils";

import { useSession } from "@/features/auth/hooks/useSession";
import { DogAvatar } from "@/features/dogs/components/DogAvatar";
import { ScheduleExerciseDialog } from "@/features/events/components/ScheduleExerciseDialog";

import { dismissedNeglectedWeekAtom } from "../atoms/dismissedNeglectedWeekAtom";

const visibleRows = 3;

// Figma "Upozornění · Disciplíny bez cvičení" (648:8653), spec 667:20329.
export function NeglectedDisciplines({
  items,
  weekStart,
}: {
  items: NeglectedDiscipline[];
  weekStart: string;
}) {
  const { t, i18n } = useTranslation();
  const userId = useSession().user?.id ?? "";
  const [dismissed, setDismissed] = useAtom(dismissedNeglectedWeekAtom);
  const [expanded, setExpanded] = useState(false);
  const [scheduling, setScheduling] = useState<NeglectedDiscipline | null>(
    null,
  );
  // The dialog moves a past date to today, so a page left open overnight is fine.
  const [today] = useState(() => new Date());
  const dialog = scheduling && (
    <ScheduleExerciseDialog
      date={today}
      initialDogId={scheduling.dog.id}
      initialDisciplineId={scheduling.discipline.id}
      onClose={() => setScheduling(null)}
    />
  );
  // Keep the dialog open when its own scheduling removes the last row.
  if (items.length === 0 || dismissed[userId] === weekStart) return dialog;

  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "cs", {
    day: "numeric",
    month: "numeric",
  });
  const title = t(($) => $.overview.neglected.title[pluralForm(items.length)], {
    count: items.length,
  });
  const hidden = items.length - visibleRows;
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-1 rounded-3xl bg-warning-soft pb-3"
    >
      {/* Spec: the kit's warning alert as the header, without its own surface. */}
      <Alert status="warning" className="bg-transparent shadow-none">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{title}</Alert.Title>
        </Alert.Content>
        <CloseButton
          aria-label={t(($) => $.overview.neglected.dismiss)}
          onPress={() => setDismissed({ ...dismissed, [userId]: weekStart })}
        />
      </Alert>
      <div className="flex flex-col items-start gap-2 pr-4 pl-11">
        <PresenceList className="flex w-full flex-col gap-2">
          {(expanded ? items : items.slice(0, visibleRows)).map((item) => (
            <PresenceItem
              key={`${item.dog.id}:${item.discipline.id}`}
              className="flex items-center gap-3"
            >
              <DogAvatar dog={item.dog} className="size-7" />
              <div className="flex min-w-0 flex-1 flex-col wrap-break-word">
                <span className="text-sm leading-6 font-medium">
                  {item.dog.name} · {item.discipline.name}
                </span>
                <span className="text-xs leading-5 text-muted">
                  {item.lastTrainedAt ? (
                    <time dateTime={item.lastTrainedAt}>
                      {t(($) => $.overview.neglected.lastTrained, {
                        date: date.format(new Date(item.lastTrainedAt)),
                      })}
                    </time>
                  ) : (
                    t(($) => $.overview.neglected.neverTrained)
                  )}
                </span>
              </div>
              <Button
                variant="tertiary"
                size="sm"
                aria-label={t(($) => $.overview.neglected.scheduleFor, {
                  dog: item.dog.name,
                  discipline: item.discipline.name,
                })}
                onPress={() => setScheduling(item)}
              >
                {t(($) => $.overview.neglected.schedule)}
              </Button>
            </PresenceItem>
          ))}
        </PresenceList>
        {hidden > 0 && (
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={expanded}
            onPress={() => setExpanded(!expanded)}
          >
            {expanded
              ? t(($) => $.overview.neglected.showLess)
              : t(($) => $.overview.neglected.showMore, { count: hidden })}
            <ChevronDown
              className={cn("size-4", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </Button>
        )}
      </div>
      {dialog}
    </section>
  );
}

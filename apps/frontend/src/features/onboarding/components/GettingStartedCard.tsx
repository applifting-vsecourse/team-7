import { Circle, CircleCheck, Compass } from "@gravity-ui/icons";
import { Alert, Button, CloseButton } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { useTour } from "../hooks/useTour";

/**
 * Figma O12 "Karta Začínáme": shown on the overview after the tour was left
 * early, until everything is done or the user hides it for good.
 */
export function GettingStartedCard() {
  const { t } = useTranslation();
  const tour = useTour();
  const data = tour.data;
  if (!data || data.status !== "dismissed" || data.cardHidden) return null;

  const items = [
    { done: data.hasDog, label: t(($) => $.onboarding.card.addDog) },
    {
      done: data.hasDiscipline,
      label: t(($) => $.onboarding.card.assignDiscipline),
    },
    { done: data.hasWeekPlan, label: t(($) => $.onboarding.card.planWeek) },
  ];
  const count = items.filter((item) => item.done).length;
  if (count === items.length) return null;

  const title = t(($) => $.onboarding.card.title, { count });
  const resume = (className: string) => (
    <Button className={className} onPress={tour.resume}>
      {t(($) => $.onboarding.card.continue)}
    </Button>
  );
  return (
    // Same composition as the neglected-discipline warning: the kit's alert
    // as the header, without its own surface, and the list below.
    <section
      aria-label={title}
      className="flex animate-enter flex-col gap-1 rounded-3xl bg-accent-soft pb-4"
    >
      <Alert status="accent" className="bg-transparent shadow-none">
        <Alert.Indicator>
          <Compass className="size-4" aria-hidden="true" />
        </Alert.Indicator>
        <Alert.Content className="gap-2 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <Alert.Title>{title}</Alert.Title>
            <Alert.Description>
              {t(($) => $.onboarding.card.description)}
            </Alert.Description>
          </div>
          {/* Phones: under the list, full width (spec). */}
          {resume("hidden shrink-0 sm:inline-flex")}
        </Alert.Content>
        <CloseButton
          aria-label={t(($) => $.onboarding.card.hide)}
          onPress={tour.hideCard}
        />
      </Alert>
      <ul className="flex flex-col gap-2 pr-4 pl-11">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            {item.done ? (
              <CircleCheck
                className="size-4 shrink-0 text-success"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="size-4 shrink-0 text-muted"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "text-sm leading-6 font-medium",
                item.done && "text-muted line-through",
              )}
            >
              {item.label}
              {item.done && (
                <span className="sr-only">
                  {` (${t(($) => $.onboarding.card.done)})`}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="px-4 pt-3 sm:hidden">{resume("w-full")}</div>
    </section>
  );
}

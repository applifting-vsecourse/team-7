import { useState } from "react";
import { Archive, ChevronRight } from "@gravity-ui/icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { differenceInYears, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { PresenceItem, PresenceList } from "@/components/PresenceList";
import { pluralForm } from "@/lib/plural";

import { useSession } from "@/features/auth/hooks/useSession";
import { EmptyState } from "@/features/disciplines/components/EmptyState";

import { archivedDogsQueryOptions, type Dog } from "../api/dogsQueryOptions";
import { DogAvatar } from "./DogAvatar";
import { QueryFeedback } from "./QueryFeedback";
import { RestoreDogButton } from "./RestoreDogButton";

export function ArchivedDogs() {
  const { t } = useTranslation();
  const { user } = useSession();
  const query = useQuery(archivedDogsQueryOptions(user?.id));
  const isEmpty = query.data?.length === 0;
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Archive className="size-7 shrink-0" aria-hidden="true" />
          <h1
            id="archive-heading"
            className="text-3xl leading-9 font-semibold tracking-tight"
          >
            {t(($) => $.dogArchive.title)}
          </h1>
        </div>
        {query.data && !isEmpty && (
          <p className="text-base leading-7">{t(($) => $.dogArchive.intro)}</p>
        )}
      </div>
      <QueryFeedback query={query} />
      {query.data && (
        <PresenceList
          empty={
            <EmptyState
              icon={Archive}
              title={t(($) => $.dogArchive.emptyTitle)}
              description={t(($) => $.dogArchive.emptyDescription)}
            />
          }
          className="flex w-full max-w-3xl flex-col gap-3"
        >
          {query.data.map((dog) => (
            <PresenceItem key={dog.id}>
              <ArchivedDogCard dog={dog} />
            </PresenceItem>
          ))}
        </PresenceList>
      )}
    </>
  );
}

function ArchivedDogCard({ dog }: { dog: Dog }) {
  const { t, i18n } = useTranslation();
  const [today] = useState(() => new Date());
  const age = dog.birthDate
    ? differenceInYears(today, parseISO(dog.birthDate))
    : undefined;
  const meta = [
    dog.breed,
    age !== undefined
      ? t(($) => $.dogProfile.age[pluralForm(age)], { count: age })
      : null,
    dog.archivedAt
      ? t(($) => $.dogArchive.archivedOn, {
          date: new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "cs").format(
            parseISO(dog.archivedAt),
          ),
        })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-background p-4 shadow-card sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <DogAvatar dog={dog} className="size-12" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* Only the name links to the detail; the restore button sits outside it. */}
          <h2 className="text-xl leading-7 font-semibold tracking-tight">
            <Link
              to={ROUTES.dog}
              params={{ dogId: dog.id }}
              className="inline-flex max-w-full items-center gap-1 rounded-sm outline-none focus-visible:focus-ring"
            >
              <span className="min-w-0 wrap-break-word">{dog.name}</span>
              <ChevronRight
                className="size-4 shrink-0 text-muted"
                aria-hidden="true"
              />
            </Link>
          </h2>
          {meta && <p className="text-sm leading-6 text-muted">{meta}</p>}
        </div>
      </div>
      <RestoreDogButton
        dog={dog}
        variant="secondary"
        className="w-full sm:w-auto"
      />
    </article>
  );
}

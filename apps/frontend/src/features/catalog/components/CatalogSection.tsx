import { Accordion, Button, buttonVariants, toast } from "@heroui/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";

import { useSession } from "@/features/auth/hooks/useSession";
import {
  catalogExerciseCount,
  useCatalog,
} from "@/features/disciplines/hooks/useCatalog";
import { useDisciplines } from "@/features/disciplines/hooks/useDisciplines";
import { useCopyCatalogDiscipline } from "@/features/disciplines/hooks/useLibraryMutations";
import { useGoalsSummary } from "@/features/dogs/components/AssignDisciplineDialog";
import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";

import { CategoryTrigger } from "./CategoryTrigger";

/**
 * Library page catalog (#14): one collapsed card per category, so the page
 * stays calm until the handler opens one. Adding copies the discipline into
 * the library and opens it; one already copied just links to it.
 */
export function CatalogSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const summary = useGoalsSummary();
  const catalog = useCatalog();
  const library = useDisciplines(user?.id);
  const copy = useCopyCatalogDiscipline();

  return (
    <section aria-labelledby="catalog-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          id="catalog-heading"
          className="text-xl leading-7 font-semibold tracking-tight"
        >
          {t(($) => $.disciplines.catalog.title)}
        </h2>
        <p className="text-sm leading-6 text-muted">
          {t(($) => $.disciplines.catalog.intro)}
        </p>
      </div>
      <QueryFeedback
        query={catalog}
        errorMessage={t(($) => $.disciplines.catalog.loadError)}
      />
      {catalog.data && (
        <Accordion hideSeparator className="flex flex-col gap-3">
          {catalog.data.map((category) => (
            <Accordion.Item
              key={category.key}
              id={category.key}
              className="rounded-2xl bg-background shadow-card"
            >
              <Accordion.Heading level={3}>
                <CategoryTrigger
                  name={category.name}
                  description={category.description}
                />
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>
                  <ul className="flex flex-col">
                    {category.disciplines.map((item) => {
                      const copied = library.data?.find(
                        (own) => own.catalogKey === item.key,
                      );
                      const counts = summary(
                        item.goals.length,
                        catalogExerciseCount(item),
                      );
                      return (
                        <li
                          key={item.key}
                          className="flex flex-col gap-3 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <h4 className="text-base leading-6 font-medium">
                              {item.name}
                            </h4>
                            <p className="line-clamp-2 text-sm leading-6 text-muted">
                              {item.description}
                            </p>
                            <p className="text-sm leading-6 text-muted">
                              {copied
                                ? t(($) => $.disciplines.catalog.inLibrary, {
                                    summary: counts,
                                  })
                                : counts}
                            </p>
                          </div>
                          {copied ? (
                            <Link
                              to={ROUTES.discipline}
                              params={{ disciplineId: copied.id }}
                              className={buttonVariants({
                                variant: "tertiary",
                                size: "sm",
                                className: "self-start sm:self-center",
                              })}
                            >
                              {t(($) => $.disciplines.catalog.open)}
                            </Link>
                          ) : (
                            <Button
                              variant="tertiary"
                              size="sm"
                              className="self-start sm:self-center"
                              isDisabled={copy.isPending}
                              isPending={
                                copy.isPending &&
                                copy.variables?.key === item.key
                              }
                              onPress={async () => {
                                try {
                                  const { id } = await copy.mutateAsync({
                                    key: item.key,
                                    lng: catalog.lng,
                                  });
                                  toast.success(
                                    t(($) => $.disciplines.catalog.addedToast, {
                                      name: item.name,
                                    }),
                                  );
                                  void navigate({
                                    to: ROUTES.discipline,
                                    params: { disciplineId: id },
                                  });
                                } catch {
                                  toast.danger(
                                    t(($) => $.disciplines.catalog.copyError),
                                  );
                                }
                              }}
                            >
                              {t(($) => $.disciplines.catalog.add)}
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </section>
  );
}

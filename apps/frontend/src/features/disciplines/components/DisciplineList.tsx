import { useState } from "react";
import { Accordion, Button, toast } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { czechFrom, pluralForm } from "@/lib/plural";

import { useSession } from "@/features/auth/hooks/useSession";
import type { Dog } from "@/features/dogs/api/dogsQueryOptions";
import { DogAvatar } from "@/features/dogs/components/DogAvatar";
import { useDogs } from "@/features/dogs/hooks/useDogs";

import {
  type DisciplineGroup,
  type DisciplineItem,
  useDisciplineGroups,
} from "../hooks/useDisciplineGroups";
import { useCopyCatalogDiscipline } from "../hooks/useLibraryMutations";
import { AssignToDog, DogPickDialog } from "./AddToDogDialog";
import { DisciplineTile } from "./DisciplineTile";

/**
 * Every discipline the handler can train, ready-made and their own, in one
 * list by area (#14). Every area starts collapsed, so the page opens calm;
 * the header says what is trained in it.
 */
export function DisciplineList() {
  const { t } = useTranslation();
  const { user } = useSession();
  const navigate = useNavigate();
  const disciplines = useDisciplineGroups();
  const dogs = (useDogs(user?.id).data ?? []).filter((dog) => !dog.locked);
  const copy = useCopyCatalogDiscipline();
  const [picking, setPicking] = useState<DisciplineItem | null>(null);
  const [assigning, setAssigning] = useState<{
    dogId: string;
    disciplineId: string;
  } | null>(null);

  // A ready-made discipline becomes the handler's on first use, silently.
  const ensureId = async (item: DisciplineItem) => {
    if (item.id) return item.id;
    try {
      const { id } = await copy.mutateAsync({
        key: item.catalogKey!,
        lng: disciplines.lng,
      });
      return id;
    } catch {
      toast.danger(t(($) => $.disciplines.prepareError));
      return null;
    }
  };
  const freeDogs = (item: DisciplineItem) =>
    dogs.filter((dog) => !item.dogs.some((trains) => trains.id === dog.id));
  const assign = async (item: DisciplineItem, dogId: string) => {
    const disciplineId = await ensureId(item);
    if (!disciplineId) return;
    setPicking(null);
    setAssigning({ dogId, disciplineId });
  };

  if (disciplines.isPending) {
    return (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.disciplines.loading)}
      </p>
    );
  }
  if (!disciplines.groups) {
    return (
      <div
        role="alert"
        className="flex animate-enter flex-col items-start gap-3"
      >
        <p className="text-sm text-danger">
          {t(($) => $.disciplines.loadError)}
        </p>
        <Button variant="secondary" onPress={disciplines.refetch}>
          {t(($) => $.disciplines.retry)}
        </Button>
      </div>
    );
  }

  const groups = disciplines.groups;
  return (
    <>
      <Accordion allowsMultipleExpanded className="flex flex-col gap-2">
        {groups.map((group) => (
          <Accordion.Item key={group.key} id={group.key}>
            <Accordion.Heading level={2}>
              <GroupTrigger group={group} dogs={dogs} />
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                <ul className="grid stagger grid-cols-1 gap-4 pt-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {group.items.map((item) => (
                    <li
                      key={item.id ?? item.catalogKey}
                      className="flex min-w-0 flex-col"
                    >
                      <DisciplineTile
                        item={item}
                        dogs={dogs}
                        freeDogs={freeDogs(item)}
                        isBusy={copy.isPending}
                        onOpen={async () => {
                          const disciplineId = await ensureId(item);
                          if (disciplineId) {
                            void navigate({
                              to: ROUTES.discipline,
                              params: { disciplineId },
                            });
                          }
                        }}
                        onAddToDog={() => {
                          const free = freeDogs(item);
                          if (free.length === 1) void assign(item, free[0]!.id);
                          else setPicking(item);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
      {picking && (
        <DogPickDialog
          name={picking.name}
          dogs={freeDogs(picking)}
          isPending={copy.isPending}
          onPick={(dogId) => void assign(picking, dogId)}
          onClose={() => setPicking(null)}
        />
      )}
      {assigning && (
        <AssignToDog {...assigning} onClose={() => setAssigning(null)} />
      )}
    </>
  );
}

/** Area name, "training 2 of 5" (or the count) and who trains something. */
function GroupTrigger({
  group,
  dogs,
}: {
  group: DisciplineGroup;
  dogs: Dog[];
}) {
  const { t } = useTranslation();
  const trained = group.items.filter((item) => item.dogs.length > 0).length;
  const count = group.items.length;
  const trainers = dogs.filter((dog) =>
    group.items.some((item) => item.dogs.some((ref) => ref.id === dog.id)),
  );
  return (
    <Accordion.Trigger className="gap-3">
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3">
        <span className="text-lg leading-7 font-semibold tracking-tight">
          {group.name}
        </span>
        <span className="text-sm leading-6 font-normal text-muted">
          {trained > 0
            ? t(($) => $.disciplines.trainedSummary, {
                trained,
                count,
                from: czechFrom(count),
              })
            : t(($) => $.disciplines.disciplineCount[pluralForm(count)], {
                count,
              })}
        </span>
      </span>
      {trainers.length > 0 && (
        <span className="flex shrink-0 gap-1">
          {trainers.map((dog) => (
            <DogAvatar key={dog.id} dog={dog} className="size-7" />
          ))}
        </span>
      )}
      <Accordion.Indicator />
    </Accordion.Trigger>
  );
}

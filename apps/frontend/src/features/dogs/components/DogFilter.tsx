import type { ReactNode } from "react";
import { Button, Checkbox, Separator } from "@heroui/react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";
import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";
import { useDogs } from "@/features/dogs/hooks/useDogs";

import { DogAvatar } from "./DogAvatar";

export function DogFilter() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { data: dogs, isPending, isError, refetch } = useDogs(user?.id);
  const [selectedDogIds, setSelectedDogIds] = useAtom(selectedDogIdsAtom);

  if (!user) return null;

  if (isPending) {
    return (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.dogs.loading)}
      </p>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p role="alert" className="text-sm text-danger">
          {t(($) => $.dogs.loadError)}
        </p>
        <Button variant="secondary" onPress={() => void refetch()}>
          {t(($) => $.dogs.retry)}
        </Button>
      </div>
    );
  }

  if (dogs.length === 0) {
    return <p className="text-sm text-muted">{t(($) => $.dogs.filterEmpty)}</p>;
  }

  const selected = selectedDogIds ?? dogs.map((dog) => dog.id);
  const allSelected = dogs.every((dog) => selected.includes(dog.id));
  // Back to "all" once every dog is checked, so dogs added later are included.
  const select = (ids: string[]) =>
    setSelectedDogIds(dogs.every((dog) => ids.includes(dog.id)) ? null : ids);

  return (
    <div
      role="group"
      aria-label={t(($) => $.dogs.filterLabel)}
      className="flex flex-wrap items-center gap-3 py-1"
    >
      <FilterOption
        isSelected={allSelected}
        isIndeterminate={
          !allSelected && dogs.some((dog) => selected.includes(dog.id))
        }
        onChange={(checked) => setSelectedDogIds(checked ? null : [])}
      >
        {t(($) => $.dogs.all)}
      </FilterOption>
      <Separator orientation="vertical" className="h-12 shrink-0" />
      {dogs.map((dog) => (
        <FilterOption
          key={dog.id}
          isSelected={selected.includes(dog.id)}
          onChange={(checked) =>
            select(
              checked
                ? [...selected.filter((id) => id !== dog.id), dog.id]
                : selected.filter((id) => id !== dog.id),
            )
          }
        >
          <DogAvatar dog={dog} />
          <span className="min-w-0 wrap-break-word">{dog.name}</span>
        </FilterOption>
      ))}
    </div>
  );
}

function FilterOption({
  children,
  isSelected,
  isIndeterminate = false,
  onChange,
}: {
  children: ReactNode;
  isSelected: boolean;
  isIndeterminate?: boolean;
  onChange: (selected: boolean) => void;
}) {
  return (
    <Checkbox
      isSelected={isSelected}
      isIndeterminate={isIndeterminate}
      onChange={onChange}
      className="max-w-full"
    >
      {/* Same hover lift as the discipline cards and calendar items. */}
      <Checkbox.Content className="min-h-12 max-w-full cursor-pointer gap-3 rounded-3xl bg-surface-secondary px-3 py-1 text-sm leading-6 font-medium transition duration-100 ease-out hover:shadow-overlay data-[indeterminate=true]:bg-accent-soft data-[selected=true]:bg-accent-soft motion-safe:hover:-translate-y-0.5">
        {children}
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
      </Checkbox.Content>
    </Checkbox>
  );
}

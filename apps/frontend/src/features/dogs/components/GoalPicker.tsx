import type { GoalSelection } from "../api/dogProfileQueryOptions";
import { Checkbox } from "@heroui/react";
import { useTranslation } from "react-i18next";

import type { Goal } from "@/features/disciplines/api/disciplinesQueryOptions";

export function GoalPicker({
  goal,
  selection,
  onChange,
  isDisabled,
}: {
  goal: Goal;
  selection: GoalSelection | undefined;
  onChange: (selection: GoalSelection | undefined) => void;
  isDisabled?: boolean;
}) {
  const { t } = useTranslation();
  const selected = selection?.exerciseIds ?? [];
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-surface p-4 shadow-card">
      <Checkbox
        isSelected={Boolean(selection)}
        isIndeterminate={Boolean(
          selection &&
          goal.exercises.length &&
          selected.length < goal.exercises.length,
        )}
        isDisabled={isDisabled}
        onChange={(checked) =>
          onChange(
            checked
              ? {
                  goalId: goal.id,
                  exerciseIds: goal.exercises.map((item) => item.id),
                }
              : undefined,
          )
        }
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <span className="font-semibold">{goal.name}</span>
        </Checkbox.Content>
      </Checkbox>
      {selection && (
        <>
          <p className="pl-7 text-xs leading-5 text-muted">
            {t(($) => $.dogProfile.selectedExercises, {
              selected: selected.length,
              total: goal.exercises.length,
            })}
          </p>
          <div className="flex flex-col gap-2 pl-7">
            {goal.exercises.length === 0 && (
              <p className="text-sm text-muted">
                {t(($) => $.dogProfile.noExercises)}
              </p>
            )}
            {goal.exercises.map((exercise) => (
              <Checkbox
                key={exercise.id}
                isDisabled={isDisabled}
                isSelected={selected.includes(exercise.id)}
                onChange={(checked) =>
                  onChange({
                    goalId: goal.id,
                    exerciseIds: checked
                      ? [...selected, exercise.id]
                      : selected.filter((id) => id !== exercise.id),
                  })
                }
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  {exercise.name}
                </Checkbox.Content>
              </Checkbox>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

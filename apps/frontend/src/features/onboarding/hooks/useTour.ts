import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";

import {
  type Onboarding,
  onboardingKey,
  onboardingQueryOptions,
} from "../api/onboardingQueryOptions";
import { canAddToHomeScreen } from "../lib/install";
import { STEP_IDS, type StepId, tourSteps } from "../lib/steps";

type Patch = Partial<Pick<Onboarding, "status" | "step" | "cardHidden">>;

/** The first-login tour (#72): its step, kept on the server, and the moves. */
export function useTour() {
  const { user } = useSession();
  const client = useQueryClient();
  const key = onboardingKey(user?.id);
  const query = useQuery(onboardingQueryOptions(user?.id));
  const update = useMutation({
    mutationFn: (patch: Patch) => api.patch("onboarding", { json: patch }),
    // The tour moves at once; a failed save is corrected by the refetch.
    onMutate: (patch) =>
      client.setQueryData<Onboarding>(
        key,
        (old) => old && { ...old, ...patch },
      ),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });

  const data = query.data;
  const saved = STEP_IDS.find((id) => id === data?.step);
  // A new user without a dog gets the welcome once; leaving it is remembered.
  const step: StepId | null =
    data?.status === "active"
      ? (saved ?? "welcome")
      : data?.status === "pending" && !data.hasDog
        ? "welcome"
        : null;
  const steps = tourSteps(canAddToHomeScreen());

  const go = (next: StepId) => update.mutate({ status: "active", step: next });
  const finish = () => update.mutate({ status: "completed", step: null });
  const next = () => {
    const following = steps[steps.indexOf(step!) + 1];
    if (following) go(following);
    else finish();
  };

  return {
    data,
    step,
    steps,
    isFetching: query.isFetching,
    go,
    next,
    finish,
    leave: () => update.mutate({ status: "dismissed" }),
    hideCard: () => update.mutate({ cardHidden: true }),
    /** A dialog reports its saved action; only the current step moves on. */
    complete: (from: StepId) => {
      if (step === from) next();
    },
    /** "Continue the tour" (O12): the first item not done yet. */
    resume: () =>
      go(
        !data?.hasDog
          ? "addDog"
          : !data.hasDiscipline
            ? "assignDiscipline"
            : "openCalendar",
      ),
  };
}

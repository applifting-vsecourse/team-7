import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { useSession } from "@/features/auth/hooks/useSession";
import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { dogExerciseQueryOptions } from "@/features/dogs/api/dogExerciseQueryOptions";
import { DogExerciseView } from "@/features/dogs/components/DogExerciseView";
import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";
import { subscriptionError } from "@/features/subscription/hooks/subscriptionError";

export const Route = createFileRoute("/dogs/$dogId_/exercises/$exerciseId")({
  beforeLoad: requireVerifiedSession,
  component: DogExercisePage,
});
function DogExercisePage() {
  const { t } = useTranslation();
  const { dogId, exerciseId } = Route.useParams();
  const { user } = useSession();
  const query = useQuery(dogExerciseQueryOptions(user?.id, dogId, exerciseId));
  return (
    <Layout title={query.data?.exercise.name} sidebar={<Sidebar />}>
      <section className="flex min-w-0 flex-1 flex-col gap-8 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6">
        {query.isPending && (
          <p role="status" className="text-sm text-muted">
            {t(($) => $.exerciseDetail.loading)}
          </p>
        )}
        {/* A locked or archived dog shows its lock / restore panel. */}
        {query.isError && subscriptionError(query.error) && (
          <QueryFeedback query={query} dogId={dogId} />
        )}
        {query.isError && !subscriptionError(query.error) && (
          <div className="flex flex-col items-start gap-3">
            <p role="alert" className="text-sm text-danger">
              {t(($) => $.exerciseDetail.error)}
            </p>
            <Button
              variant="secondary"
              onPress={() => {
                void query.refetch();
              }}
            >
              {t(($) => $.dogs.retry)}
            </Button>
          </div>
        )}
        {query.data && (
          <DogExerciseView
            key={`${dogId}/${exerciseId}`}
            detail={query.data}
            updatedAt={query.dataUpdatedAt}
          />
        )}
      </section>
    </Layout>
  );
}

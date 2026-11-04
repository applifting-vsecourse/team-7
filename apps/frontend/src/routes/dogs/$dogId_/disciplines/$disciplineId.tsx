import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { loadBeforeTransition } from "@/lib/motion";

import { useSession } from "@/features/auth/hooks/useSession";
import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { disciplineQueryOptions } from "@/features/disciplines/api/disciplinesQueryOptions";
import {
  dogProfileQueryOptions,
  dogSelectionQueryOptions,
} from "@/features/dogs/api/dogProfileQueryOptions";
import { DogDisciplineView } from "@/features/dogs/components/DogDisciplineView";
import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";

export const Route = createFileRoute("/dogs/$dogId_/disciplines/$disciplineId")(
  {
    beforeLoad: requireVerifiedSession,
    // Same as the library detail; a preload only fills the cache.
    loader: ({ context: { queryClient, userId }, params, preload }) =>
      loadBeforeTransition(
        queryClient.ensureQueryData({
          ...dogProfileQueryOptions(userId, params.dogId),
          revalidateIfStale: !preload,
        }),
        queryClient.ensureQueryData({
          ...disciplineQueryOptions(userId, params.disciplineId),
          revalidateIfStale: !preload,
        }),
        queryClient.ensureQueryData({
          ...dogSelectionQueryOptions(
            userId,
            params.dogId,
            params.disciplineId,
          ),
          revalidateIfStale: !preload,
        }),
      ),
    component: DogDisciplinePage,
  },
);

function DogDisciplinePage() {
  const { dogId, disciplineId } = Route.useParams();
  const { user } = useSession();
  const query = useQuery(dogProfileQueryOptions(user?.id, dogId));
  return (
    <Layout
      title={
        query.data?.disciplines.find((item) => item.id === disciplineId)?.name
      }
      sidebar={<Sidebar />}
    >
      <section className="flex min-w-0 flex-1 flex-col gap-8 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6">
        <QueryFeedback query={query} />
        {query.data && (
          <DogDisciplineView
            key={`${dogId}/${disciplineId}`}
            dog={query.data}
            disciplineId={disciplineId}
          />
        )}
      </section>
    </Layout>
  );
}

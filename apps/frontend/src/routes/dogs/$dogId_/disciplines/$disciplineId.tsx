import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { ROUTES } from "@/app/routes";
import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { useSession } from "@/features/auth/hooks/useSession";
import { encodeRedirectUri } from "@/features/auth/lib/redirect";
import { dogProfileQueryOptions } from "@/features/dogs/api/dogProfileQueryOptions";
import { DogDisciplineView } from "@/features/dogs/components/DogDisciplineView";
import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";

export const Route = createFileRoute("/dogs/$dogId_/disciplines/$disciplineId")(
  {
    beforeLoad: async ({ context, location }) => {
      const session = await context.queryClient.fetchQuery(
        authSessionQueryOptions(),
      );
      if (!session) {
        throw redirect({
          to: ROUTES.login,
          search: { from: encodeRedirectUri(location) },
        });
      }
    },
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

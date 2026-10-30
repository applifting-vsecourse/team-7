import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { useSession } from "@/features/auth/hooks/useSession";
import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { dogProfileQueryOptions } from "@/features/dogs/api/dogProfileQueryOptions";
import { DogProfileView } from "@/features/dogs/components/DogProfileView";
import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";

export const Route = createFileRoute("/dogs/$dogId")({
  beforeLoad: requireVerifiedSession,
  component: DogPage,
});

function DogPage() {
  const { dogId } = Route.useParams();
  const { user } = useSession();
  const query = useQuery(dogProfileQueryOptions(user?.id, dogId));
  return (
    <Layout title={query.data?.name} sidebar={<Sidebar />}>
      <section
        aria-labelledby={query.data ? "dog-heading" : undefined}
        className="flex min-w-0 flex-1 flex-col gap-12 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6"
      >
        <QueryFeedback query={query} />
        {query.data && <DogProfileView key={dogId} dog={query.data} />}
      </section>
    </Layout>
  );
}

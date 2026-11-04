import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { loadBeforeTransition } from "@/lib/motion";

import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { disciplineQueryOptions } from "@/features/disciplines/api/disciplinesQueryOptions";
import { DisciplineDetailView } from "@/features/disciplines/components/DisciplineDetailView";

export const Route = createFileRoute("/disciplines/$disciplineId")({
  beforeLoad: requireVerifiedSession,
  // Lets the card title morph into the heading; cached data shows at once.
  // A preload (hovering the link) only fills the cache, it doesn't revalidate.
  loader: ({ context: { queryClient, userId }, params, preload }) =>
    loadBeforeTransition(
      queryClient.ensureQueryData({
        ...disciplineQueryOptions(userId, params.disciplineId),
        revalidateIfStale: !preload,
      }),
    ),
  component: DisciplinePage,
});

function DisciplinePage() {
  const { t } = useTranslation();
  const { disciplineId } = Route.useParams();

  return (
    <Layout title={t(($) => $.navigation.disciplines)} sidebar={<Sidebar />}>
      <section
        aria-labelledby="discipline-heading"
        className="flex min-w-0 flex-1 flex-col gap-8 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6"
      >
        <DisciplineDetailView disciplineId={disciplineId} />
      </section>
    </Layout>
  );
}

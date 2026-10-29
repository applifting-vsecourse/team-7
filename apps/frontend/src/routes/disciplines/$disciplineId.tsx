import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { DisciplineDetailView } from "@/features/disciplines/components/DisciplineDetailView";

export const Route = createFileRoute("/disciplines/$disciplineId")({
  beforeLoad: requireVerifiedSession,
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

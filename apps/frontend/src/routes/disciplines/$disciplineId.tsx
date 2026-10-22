import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { encodeRedirectUri } from "@/features/auth/lib/redirect";
import { DisciplineDetailView } from "@/features/disciplines/components/DisciplineDetailView";

export const Route = createFileRoute("/disciplines/$disciplineId")({
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

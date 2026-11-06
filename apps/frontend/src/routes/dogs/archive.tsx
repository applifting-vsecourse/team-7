import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { ArchivedDogs } from "@/features/dogs/components/ArchivedDogs";

export const Route = createFileRoute("/dogs/archive")({
  beforeLoad: requireVerifiedSession,
  component: DogArchivePage,
});

function DogArchivePage() {
  const { t } = useTranslation();
  return (
    <Layout title={t(($) => $.dogArchive.title)} sidebar={<Sidebar />}>
      <section
        aria-labelledby="archive-heading"
        className="flex min-w-0 flex-1 flex-col gap-12 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6"
      >
        <ArchivedDogs />
      </section>
    </Layout>
  );
}

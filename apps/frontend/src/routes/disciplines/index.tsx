import { useState } from "react";
import { ChartLine, Plus } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { DisciplineList } from "@/features/disciplines/components/DisciplineList";
import { DisciplineDialog } from "@/features/disciplines/components/LibraryDialogs";

export const Route = createFileRoute("/disciplines/")({
  beforeLoad: requireVerifiedSession,
  component: DisciplinesPage,
});

function DisciplinesPage() {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Layout title={t(($) => $.navigation.disciplines)} sidebar={<Sidebar />}>
      <section
        aria-labelledby="disciplines-heading"
        className="flex min-w-0 flex-1 flex-col gap-8 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-center gap-3">
              <ChartLine
                className="size-8 shrink-0 text-accent"
                aria-hidden="true"
              />
              <h1
                id="disciplines-heading"
                className="text-3xl leading-9 font-semibold tracking-tight"
              >
                {t(($) => $.navigation.disciplines)}
              </h1>
            </div>
            <p className="text-base leading-7">
              {t(($) => $.disciplines.intro)}
            </p>
          </div>
          <Button
            size="lg"
            className="w-full shrink-0 md:w-auto"
            onPress={() => setIsCreating(true)}
          >
            <Plus className="size-4 shrink-0" aria-hidden="true" />
            {t(($) => $.disciplines.newDiscipline)}
          </Button>
        </div>
        <DisciplineList />
      </section>
      <DisciplineDialog isOpen={isCreating} onOpenChange={setIsCreating} />
    </Layout>
  );
}

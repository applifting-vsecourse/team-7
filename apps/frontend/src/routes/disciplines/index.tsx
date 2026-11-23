import { useState } from "react";
import { Book, ChartLine, Plus } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { useSession } from "@/features/auth/hooks/useSession";
import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { CatalogDialog } from "@/features/catalog/components/CatalogDialog";
import { DisciplineList } from "@/features/disciplines/components/DisciplineList";
import { DisciplineDialog } from "@/features/disciplines/components/LibraryDialogs";
import { useDisciplines } from "@/features/disciplines/hooks/useDisciplines";

export const Route = createFileRoute("/disciplines/")({
  beforeLoad: requireVerifiedSession,
  component: DisciplinesPage,
});

function DisciplinesPage() {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const { user } = useSession();
  // An empty library shows its own primary "pick from the catalog" button;
  // keep one primary action in view (DESIGN.md).
  const isEmpty = useDisciplines(user?.id).data?.length === 0;

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
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              className="w-full md:w-auto"
              onPress={() => setIsBrowsing(true)}
            >
              <Book className="size-4 shrink-0" aria-hidden="true" />
              {t(($) => $.disciplines.browseCatalog)}
            </Button>
            <Button
              variant={isEmpty ? "secondary" : "primary"}
              className="w-full md:w-auto"
              onPress={() => setIsCreating(true)}
            >
              <Plus className="size-4 shrink-0" aria-hidden="true" />
              {t(($) => $.disciplines.newDiscipline)}
            </Button>
          </div>
        </div>
        <DisciplineList
          onBrowseCatalog={() => setIsBrowsing(true)}
          onCreate={() => setIsCreating(true)}
        />
      </section>
      <DisciplineDialog isOpen={isCreating} onOpenChange={setIsCreating} />
      {isBrowsing && <CatalogDialog onClose={() => setIsBrowsing(false)} />}
    </Layout>
  );
}

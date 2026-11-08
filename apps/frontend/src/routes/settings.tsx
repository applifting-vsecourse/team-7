import { Gear } from "@gravity-ui/icons";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { SettingsContent } from "@/features/settings/components/SettingsContent";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireVerifiedSession,
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { userId } = Route.useRouteContext();
  return (
    <Layout title={t(($) => $.navigation.settings)} sidebar={<Sidebar />}>
      <section
        aria-labelledby="settings-heading"
        className="flex min-w-0 flex-1 flex-col gap-8 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6"
      >
        <div className="flex items-center gap-3">
          <Gear className="size-8 shrink-0 text-accent" aria-hidden="true" />
          <h1
            id="settings-heading"
            className="text-3xl leading-9 font-semibold tracking-tight"
          >
            {t(($) => $.navigation.settings)}
          </h1>
        </div>
        <SettingsContent userId={userId} />
      </section>
    </Layout>
  );
}

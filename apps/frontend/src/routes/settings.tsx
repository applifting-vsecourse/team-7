import { useEffect } from "react";
import { Gear } from "@gravity-ui/icons";
import { toast } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { AccountSettings } from "@/features/settings/components/AccountSettings";

export const Route = createFileRoute("/settings")({
  validateSearch: z.object({
    emailChange: z.enum(["confirmed", "invalid"]).optional(),
  }),
  beforeLoad: requireVerifiedSession,
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { userId } = Route.useRouteContext();
  const { emailChange } = Route.useSearch();
  const navigate = useNavigate();
  useEffect(() => {
    if (!emailChange) return;
    if (emailChange === "confirmed") {
      toast.success(t(($) => $.settings.emailChangeConfirmed));
    } else toast.danger(t(($) => $.settings.emailChangeInvalid));
    void navigate({
      to: "/settings",
      search: (previous) => ({ ...previous, emailChange: undefined }),
      replace: true,
    });
  }, [emailChange, navigate, t]);
  return (
    <Layout title={t(($) => $.navigation.settings)} sidebar={<Sidebar />}>
      <section
        aria-labelledby="settings-heading"
        className="flex min-w-0 flex-1 flex-col gap-12 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6"
      >
        <div className="flex items-center gap-3">
          <Gear className="size-7 shrink-0" aria-hidden="true" />
          <h1
            id="settings-heading"
            className="text-3xl leading-9 font-semibold tracking-tight"
          >
            {t(($) => $.navigation.settings)}
          </h1>
        </div>
        <AccountSettings userId={userId} />
      </section>
    </Layout>
  );
}

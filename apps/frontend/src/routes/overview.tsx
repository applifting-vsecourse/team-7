import { Rectangles4 } from "@gravity-ui/icons";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { encodeRedirectUri } from "@/features/auth/lib/redirect";
import { DogFilter } from "@/features/dogs/components/DogFilter";

export const Route = createFileRoute("/overview")({
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
  component: OverviewPage,
});

function OverviewPage() {
  const { t } = useTranslation();

  return (
    <Layout title={t(($) => $.navigation.overview)} sidebar={<Sidebar />}>
      <section
        aria-labelledby="overview-heading"
        className="flex min-w-0 flex-1 flex-col gap-8 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6"
      >
        <div className="flex items-center gap-3">
          <Rectangles4
            className="size-8 shrink-0 text-accent"
            aria-hidden="true"
          />
          <h1
            id="overview-heading"
            className="text-3xl leading-9 font-semibold"
          >
            {t(($) => $.navigation.overview)}
          </h1>
        </div>
        <DogFilter />
      </section>
    </Layout>
  );
}

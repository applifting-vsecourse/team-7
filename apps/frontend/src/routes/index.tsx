import { createFileRoute, redirect } from "@tanstack/react-router";

import { ROUTES } from "@/app/routes";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { LandingPage } from "@/features/landing/components/LandingPage";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(
      authSessionQueryOptions(),
    );
    if (session) throw redirect({ to: ROUTES.overview });
  },
  component: LandingPage,
});

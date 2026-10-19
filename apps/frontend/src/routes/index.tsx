import { buttonVariants } from "@heroui/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { ROUTES } from "@/app/routes";
import Layout from "@/components/Layout";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(
      authSessionQueryOptions(),
    );
    if (session) throw redirect({ to: ROUTES.overview });
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <Layout title="Welcome">
      <div className="w-full">
        <section className="mx-auto w-full max-w-2xl px-4 pt-16 pb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Landing page
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-pretty text-muted">
            Trainloop!
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to={ROUTES.signup} className={buttonVariants({ size: "lg" })}>
              Create an account
            </Link>
            <Link
              to={ROUTES.login}
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}

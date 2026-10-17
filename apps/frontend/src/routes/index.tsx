import { buttonVariants } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { ROUTES } from "@/app/routes";
import Layout from "@/components/Layout";

import { HeaderMenu } from "@/features/auth/components/HeaderMenu";
import { useSession } from "@/features/auth/hooks/useSession";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { user } = useSession();

  return (
    <Layout title="Welcome" userMenu={<HeaderMenu />}>
      <div className="w-full">
        <section className="mx-auto w-full max-w-2xl px-4 pt-16 pb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Welcome.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-pretty text-muted">
            Sign in to your account or create one to get started.
          </p>

          {/* The call to action depends on who is asking: no point offering an
              account to someone who already has one. */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!user && (
              <>
                <Link
                  to={ROUTES.signup}
                  className={buttonVariants({ size: "lg" })}
                >
                  Create an account
                </Link>
                <Link
                  to={ROUTES.login}
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

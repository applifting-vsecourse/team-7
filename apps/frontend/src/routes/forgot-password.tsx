import { buttonVariants } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ROUTES } from "@/app/routes";
import DogImg from "@/assets/signin-dog.jpg";
import Layout from "@/components/Layout";

import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <Layout title="Reset password" userMenu={null}>
      <section className="mt-4 flex w-full max-w-login-block justify-center gap-8 overflow-clip rounded-3xl bg-background p-6 md:m-auto">
        <div className="flex max-w-login-form min-w-0 flex-1 flex-col gap-8">
          <div>
            <Link
              to={ROUTES.login}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to sign in
            </Link>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl leading-8 font-semibold tracking-tight">
                Reset password
              </h1>
              <p className="text-base leading-7 text-muted">
                Enter your email and we’ll send you a link to set a new
                password.
              </p>
            </div>
            <ForgotPasswordForm />
            <Link
              to={ROUTES.login}
              className="self-center text-sm font-medium text-foreground hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
        <div className="relative hidden min-w-0 flex-1 self-stretch md:block">
          <img
            src={DogImg}
            alt="dog"
            className="absolute inset-0 size-full rounded-2xl object-cover"
            loading="lazy"
          />
        </div>
      </section>
    </Layout>
  );
}

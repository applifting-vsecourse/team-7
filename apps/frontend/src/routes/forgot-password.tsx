import { buttonVariants } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import DogImg from "@/assets/signin-dog.jpg";
import Layout from "@/components/Layout";

import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <Layout title={t(($) => $.auth.reset.title)} userMenu={null}>
      <section className="mt-4 flex w-full max-w-login-block justify-center gap-8 overflow-clip rounded-3xl bg-background p-6 md:m-auto">
        <div className="flex max-w-login-form min-w-0 flex-1 flex-col gap-8">
          <div>
            <Link
              to={ROUTES.login}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t(($) => $.auth.reset.back)}
            </Link>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl leading-8 font-semibold tracking-tight">
                {t(($) => $.auth.reset.title)}
              </h1>
              <p className="text-base leading-7 text-muted">
                {t(($) => $.auth.reset.description)}
              </p>
            </div>
            <ForgotPasswordForm />
            <Link
              to={ROUTES.login}
              className="self-center text-sm font-medium text-foreground hover:underline"
            >
              {t(($) => $.auth.reset.back)}
            </Link>
          </div>
        </div>
        <div className="relative hidden min-w-0 flex-1 self-stretch md:block">
          <img
            src={DogImg}
            alt={t(($) => $.images.dog)}
            className="absolute inset-0 size-full rounded-2xl object-cover"
            loading="lazy"
          />
        </div>
      </section>
    </Layout>
  );
}

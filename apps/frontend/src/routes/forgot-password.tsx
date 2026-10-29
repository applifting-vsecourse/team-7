import { ArrowLeft } from "@gravity-ui/icons";
import { buttonVariants } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
    <Layout
      title={t(($) => $.auth.reset.title)}
      showMenu={false}
      className="p-4"
    >
      <section className="flex w-fit max-w-full justify-center gap-8 self-start overflow-clip rounded-3xl bg-background p-6 md:w-full md:max-w-login-block md:self-center">
        <div className="flex w-login-form max-w-login-form min-w-0 flex-[0_1_auto] flex-col gap-8 md:flex-1">
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

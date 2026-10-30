import { type ReactNode } from "react";
import { ArrowLeft } from "@gravity-ui/icons";
import { buttonVariants } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import DogImg from "@/assets/signin-dog.jpg";
import Layout from "@/components/Layout";
import { Logo } from "@/components/Logo";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
  footer: ReactNode;
  /** Shows a back button and the left-aligned variant without the logo. */
  backTo?: string;
};

/**
 * The Figma auth "Content" frame (43:3862): logo, heading and form on the
 * left, a photo on the right that is dropped on mobile (40:10696). It keeps
 * the app chrome; the header omits the auth menu, since offering "Sign in" on
 * the sign-in page would be noise.
 */
export function AuthLayout({
  title,
  children,
  footer,
  backTo,
}: AuthLayoutProps) {
  const { t } = useTranslation();
  return (
    <Layout title={title} showMenu={false} className="p-4">
      <section className="flex w-fit max-w-full justify-center gap-8 self-start overflow-clip rounded-3xl bg-background p-6 md:w-full md:max-w-login-block md:self-center">
        <div
          className={`flex w-login-form max-w-login-form min-w-0 flex-[0_1_auto] flex-col gap-8 md:flex-1 ${backTo ? "" : "items-center"}`}
        >
          {backTo ? (
            <div>
              <Link
                to={backTo}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t(($) => $.auth.backToSignIn)}
              </Link>
            </div>
          ) : (
            <Logo size="lg" />
          )}
          <div
            className={`flex w-full flex-col ${backTo ? "gap-6" : "items-center gap-8"}`}
          >
            <h1
              className={`w-full text-2xl leading-8 font-semibold tracking-tight ${backTo ? "" : "text-center"}`}
            >
              {title}
            </h1>
            <div className="flex w-full flex-col gap-6">
              {children}
              <p className="flex justify-center gap-2 text-sm text-muted">
                {footer}
              </p>
            </div>
          </div>
        </div>
        <div className="relative hidden min-w-0 flex-1 self-stretch md:block">
          <img
            src={DogImg}
            alt=""
            className="absolute inset-0 size-full rounded-2xl object-cover"
            loading="lazy"
          />
        </div>
      </section>
    </Layout>
  );
}

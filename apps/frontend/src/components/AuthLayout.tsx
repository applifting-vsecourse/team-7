import { type ReactNode } from "react";

import DogImg from "@/assets/signin-dog.jpg";
import Layout from "@/components/Layout";
import { Logo } from "@/components/Logo";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * The Figma auth "Content" frame (43:3862): logo, heading and form on the
 * left, a photo on the right that is dropped on mobile (40:10696). It keeps
 * the app chrome; the header omits the auth menu, since offering "Sign in" on
 * the sign-in page would be noise.
 */
export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <Layout title={title}>
      <section className="m-auto flex w-full max-w-login-block justify-center gap-8 overflow-clip rounded-3xl bg-background px-6 pt-4 pb-6 md:pt-6">
        <div className="flex max-w-login-form min-w-0 flex-1 flex-col items-center gap-8">
          <Logo size="lg" />
          <h1 className="text-2xl leading-8 font-semibold tracking-tight">
            {title}
          </h1>
          <div className="flex w-full flex-col gap-6">
            {children}
            <p className="flex justify-center gap-2 text-sm text-muted">
              {footer}
            </p>
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

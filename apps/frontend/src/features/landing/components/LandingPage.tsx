import { buttonVariants } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ClipboardCheck,
  History,
  ListTree,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import HeroImg from "@/assets/landing-hero.jpg";
import Layout from "@/components/Layout";

const features = [
  { id: "plan", icon: ListTree },
  { id: "calendar", icon: CalendarDays },
  { id: "log", icon: ClipboardCheck },
  { id: "progress", icon: History },
] as const satisfies readonly { id: string; icon: LucideIcon }[];

/**
 * Public landing page: a photo-backed intro with the sign-up / sign-in CTAs,
 * then what the app does, then a closing sign-up prompt for visitors who read
 * to the end.
 */
export function LandingPage() {
  const { t } = useTranslation();
  return (
    <Layout
      title={t(($) => $.landing.title)}
      className="flex-col items-center justify-start gap-4 sm:gap-8"
    >
      <section className="relative isolate mt-2 w-full max-w-content overflow-clip rounded-3xl bg-background sm:mt-4">
        <img
          src={HeroImg}
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover"
          fetchPriority="high"
        />
        {/* Scrim keeps the text on theme tokens readable over any photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-background/80 md:bg-transparent md:bg-linear-to-r md:from-background/90 md:via-background/60 md:via-30% md:to-transparent md:to-55%"
        />
        <div className="flex max-w-2xl flex-col items-start gap-6 px-6 py-20 sm:px-10 md:px-16 md:py-32">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            {t(($) => $.landing.heading)}
          </h1>
          <p className="max-w-xl text-lg text-pretty">
            {t(($) => $.landing.lead)}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to={ROUTES.signup} className={buttonVariants({ size: "lg" })}>
              {t(($) => $.landing.signUp)}
            </Link>
            <Link
              to={ROUTES.login}
              className={buttonVariants({ size: "lg", variant: "tertiary" })}
            >
              {t(($) => $.landing.signIn)}
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="landing-features"
        className="flex w-full max-w-content flex-col gap-10 rounded-3xl bg-background px-6 py-16 sm:px-10 md:px-16"
      >
        <div className="flex max-w-2xl flex-col gap-3">
          <h2
            id="landing-features"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {t(($) => $.landing.featuresHeading)}
          </h2>
          <p className="text-muted">{t(($) => $.landing.featuresLead)}</p>
        </div>
        <ul className="grid gap-x-12 gap-y-8 md:grid-cols-2">
          {features.map(({ id, icon: Icon }) => (
            <li key={id} className="flex gap-4">
              <Icon
                className="size-6 shrink-0 text-accent"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold tracking-tight">
                  {t(($) => $.landing.features[id].title)}
                </h3>
                <p className="text-muted">
                  {t(($) => $.landing.features[id].description)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-start gap-4 border-t border-border pt-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {t(($) => $.landing.closingHeading)}
            </h2>
            <p className="text-muted">{t(($) => $.landing.closingLead)}</p>
          </div>
          <Link
            to={ROUTES.signup}
            className={buttonVariants({ size: "lg", variant: "secondary" })}
          >
            {t(($) => $.landing.signUp)}
          </Link>
        </div>
      </section>
    </Layout>
  );
}

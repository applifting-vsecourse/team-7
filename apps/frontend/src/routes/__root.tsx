import { Toast } from "@heroui/react";
import { I18nProvider } from "@heroui/react/rac";
import { type QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Outlet,
  retainSearchParams,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { OnboardingTour } from "@/features/onboarding/components/OnboardingTour";

import "@/styles/global.css";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  validateSearch: (search: Record<string, unknown>): { lng?: string } =>
    typeof search.lng === "string" ? { lng: search.lng } : {},
  search: {
    middlewares: [retainSearchParams(["lng"])],
  },
  component: RootComponent,
});

function RootComponent() {
  const { i18n } = useTranslation();

  // Dates and numbers in kit controls follow the app language, not the browser's.
  return (
    <I18nProvider locale={i18n.resolvedLanguage}>
      <Outlet />
      {/* Above the pages, so the tour (and its spotlight) carries on across
          the navigations it leads the user through. */}
      <OnboardingTour />
      <Toast.Provider placement="top" />
    </I18nProvider>
  );
}

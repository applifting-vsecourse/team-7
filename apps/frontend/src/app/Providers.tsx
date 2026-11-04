import { RouterProvider as AriaRouterProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { DevTools } from "jotai-devtools";
import css from "jotai-devtools/styles.css?inline";
import { domMax, LazyMotion, MotionConfig } from "motion/react";

import { router } from "@/app/router";
import { queryClient } from "@/config/react-query";
import { ThemeController } from "@/hooks/useTheme";

const JotaiDevTools = () =>
  process.env.NODE_ENV !== "production" ? (
    <>
      <style>{css}</style>
      <DevTools />
    </>
  ) : null;

export function Providers() {
  return (
    <>
      <JotaiDevTools />
      <QueryClientProvider client={queryClient}>
        <ThemeController>
          {/* strict: only the lightweight `m` components, never `motion.*`.
              Not loaded lazily: list items start invisible and only these
              features reveal them, so a failed chunk would hide the content. */}
          <LazyMotion features={domMax} strict>
            <MotionConfig reducedMotion="user">
              <AriaRouterProvider
                navigate={(to) => router.navigate({ to })}
                useHref={(to) => router.buildLocation({ to }).href}
              >
                <RouterProvider router={router} />
              </AriaRouterProvider>
            </MotionConfig>
          </LazyMotion>
        </ThemeController>
      </QueryClientProvider>
    </>
  );
}

import { RouterProvider as AriaRouterProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { DevTools } from "jotai-devtools";
import { LazyMotion, MotionConfig } from "motion/react";

import { router } from "@/app/router";
import { queryClient } from "@/config/react-query";
import { ThemeController } from "@/hooks/useTheme";
import "jotai-devtools/styles.css";

const loadMotionFeatures = () =>
  import("@/lib/motion-features").then((module) => module.default);

export function Providers() {
  return (
    <>
      <DevTools />
      <QueryClientProvider client={queryClient}>
        <ThemeController>
          {/* strict: only the lightweight `m` components, never `motion.*` */}
          <LazyMotion features={loadMotionFeatures} strict>
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

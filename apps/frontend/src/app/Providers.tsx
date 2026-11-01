import { RouterProvider as AriaRouterProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { DevTools } from "jotai-devtools";
import css from "jotai-devtools/styles.css?inline";

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
          <AriaRouterProvider
            navigate={(to) => router.navigate({ to })}
            useHref={(to) => router.buildLocation({ to }).href}
          >
            <RouterProvider router={router} />
          </AriaRouterProvider>
        </ThemeController>
      </QueryClientProvider>
    </>
  );
}

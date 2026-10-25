import { RouterProvider as AriaRouterProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { DevTools } from "jotai-devtools";

import { router } from "@/app/router";
import { queryClient } from "@/config/react-query";
import { ThemeController } from "@/hooks/useTheme";
import "jotai-devtools/styles.css";

export function Providers() {
  return (
    <>
      <DevTools />
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

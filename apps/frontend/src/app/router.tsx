import { createRouter } from "@tanstack/react-router";

import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import { NotFound } from "@/components/Error/NotFound";
import { RootErrorBoundary } from "@/components/Error/RootErrorBoundary";
import { queryClient } from "@/config/react-query";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  // From md up, sidebar pages scroll <main>, not the window. Without this the
  // router carries <main>'s scroll position over to the next page, so a
  // detail opened from a scrolled list started halfway down. Back and forward
  // still restore the position.
  scrollToTopSelectors: ["window", "main[data-page-scroller]"],
  defaultViewTransition: true,
  defaultNotFoundComponent: NotFound,
  defaultErrorComponent: ({ error }) => <RootErrorBoundary error={error} />,
  defaultPendingComponent: AppLoadingScreen,
});

declare module "@tanstack/react-router" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- TanStack Router registration requires declaration merging.
  interface Register {
    router: typeof router;
  }
}

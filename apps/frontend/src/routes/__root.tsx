import { Toast } from "@heroui/react";
import { type QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Outlet,
  retainSearchParams,
} from "@tanstack/react-router";

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
  return (
    <>
      <Outlet />
      <Toast.Provider placement="top" />
    </>
  );
}

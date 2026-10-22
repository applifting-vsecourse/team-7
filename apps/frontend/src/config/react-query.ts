import { type DefaultOptions, QueryClient } from "@tanstack/react-query";
import type { HTTPError } from "ky";

// Every request goes through the ky client, so query and mutation errors are
// typed as its HTTPError. Network failures still reject without a response.
declare module "@tanstack/react-query" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- TanStack Query registration requires declaration merging.
  interface Register {
    defaultError: HTTPError;
  }
}

const defaultQueryConfig = {
  queries: {
    // Refetching when the tab regains focus is how a feed stays fresh without
    // polling or websockets. It is TanStack's default; don't turn it off.
    refetchOnWindowFocus: true,
    // Fail fast and visibly in development rather than hiding errors behind retries.
    retry: 0,
  },
} satisfies DefaultOptions;

export const queryClient = new QueryClient({
  defaultOptions: defaultQueryConfig,
});

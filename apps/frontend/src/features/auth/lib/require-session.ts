import { type QueryClient } from "@tanstack/react-query";
import { type ParsedLocation, redirect } from "@tanstack/react-router";

import { ROUTES } from "@/app/routes";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { encodeRedirectUri } from "@/features/auth/lib/redirect";

type BeforeLoadArgs = {
  context: { queryClient: QueryClient };
  location: ParsedLocation;
};

/** `beforeLoad` of app pages: signed-in users with a verified email only. */
export async function requireVerifiedSession({
  context,
  location,
}: BeforeLoadArgs) {
  const session = await context.queryClient.fetchQuery(
    authSessionQueryOptions(),
  );
  if (!session) {
    throw redirect({
      to: ROUTES.login,
      search: { from: encodeRedirectUri(location) },
    });
  }
  if (!session.user.emailVerified) throw redirect({ to: ROUTES.verifyEmail });
}

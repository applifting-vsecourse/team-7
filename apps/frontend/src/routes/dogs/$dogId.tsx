import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { useSession } from "@/features/auth/hooks/useSession";
import { encodeRedirectUri } from "@/features/auth/lib/redirect";
import { EditDogPhotoDialog } from "@/features/dogs/components/EditDogPhotoDialog";
import { useDogs } from "@/features/dogs/hooks/useDogs";

export const Route = createFileRoute("/dogs/$dogId")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(
      authSessionQueryOptions(),
    );
    if (!session) {
      throw redirect({
        to: ROUTES.login,
        search: { from: encodeRedirectUri(location) },
      });
    }
  },
  component: DogPage,
});

// Placeholder until the dog profile is designed.
function DogPage() {
  const { t } = useTranslation();
  const { dogId } = Route.useParams();
  const { user } = useSession();
  const { data: dogs, isPending, isError } = useDogs(user?.id);
  const dog = dogs?.find((item) => item.id === dogId);

  return (
    <Layout title={dog?.text} sidebar={<Sidebar />}>
      <section
        aria-labelledby="dog-heading"
        className="flex min-w-0 flex-1 flex-col gap-8 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6"
      >
        {isPending ? (
          <p role="status" className="text-sm text-muted">
            {t(($) => $.dogs.pageLoading)}
          </p>
        ) : isError ? (
          <p role="alert" className="text-sm text-danger">
            {t(($) => $.dogs.loadError)}
          </p>
        ) : !dog ? (
          <p role="alert" className="text-sm text-danger">
            {t(($) => $.dogs.notFound)}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <EditDogPhotoDialog dog={dog} avatarClassName="size-16" />
              <h1
                id="dog-heading"
                className="min-w-0 text-3xl leading-9 font-semibold tracking-tight wrap-break-word"
              >
                {dog.text}
              </h1>
            </div>
            <p className="text-base leading-7 text-muted">
              {t(($) => $.dogs.pagePlaceholder)}
            </p>
          </>
        )}
      </section>
    </Layout>
  );
}

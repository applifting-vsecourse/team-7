import { Circle } from "@gravity-ui/icons";
import { buttonVariants } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";
import { ROUTES } from "@/app/routes";

import { useSession } from "@/features/auth/hooks/useSession";
import { useDogs } from "@/features/dogs/hooks/useDogs";

import { DogAvatar } from "./DogAvatar";

export function SidebarDogs() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { data: dogs, isPending, isError } = useDogs(user?.id);
  const setMobileSidebarOpen = useSetAtom(mobileSidebarOpenAtom);

  if (!user) return null;

  if (isPending) {
    return (
      <p role="status" className="px-4 text-sm text-muted">
        {t(($) => $.dogs.loading)}
      </p>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="px-4 text-sm text-danger">
        {t(($) => $.dogs.loadError)}
      </p>
    );
  }

  if (dogs.length === 0) {
    return <p className="px-4 text-sm text-muted">{t(($) => $.dogs.empty)}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {dogs.map((dog) => (
        <li key={dog.id}>
          {/* Styled like the main navigation links above. */}
          <Link
            to={ROUTES.dog}
            params={{ dogId: dog.id }}
            onClick={() => setMobileSidebarOpen(false)}
            className={buttonVariants({
              variant: "ghost",
              className:
                "h-auto w-full justify-start gap-3 py-1.5 pr-3 pl-1.5 data-[status=active]:bg-accent data-[status=active]:text-accent-foreground md:pr-4",
            })}
          >
            <DogAvatar dog={dog} />
            <span
              title={dog.text}
              className="min-w-0 flex-1 truncate text-left"
            >
              {dog.text}
            </span>
            <Circle
              className="hidden size-4 shrink-0 in-[[data-status=active]]:block"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

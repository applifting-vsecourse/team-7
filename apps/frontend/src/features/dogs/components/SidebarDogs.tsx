import { Dog } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";
import { useDogs } from "@/features/dogs/hooks/useDogs";

export function SidebarDogs() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { data: dogs, isPending, isError } = useDogs(user?.id);

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
        <li
          key={dog.id}
          className="flex items-center gap-3 rounded-3xl px-3 py-1.5 text-sm font-medium md:px-4 md:py-3"
        >
          <Dog
            className="size-9 shrink-0 text-accent md:size-5"
            aria-hidden="true"
          />
          <span className="min-w-0 wrap-break-word">{dog.text}</span>
        </li>
      ))}
    </ul>
  );
}

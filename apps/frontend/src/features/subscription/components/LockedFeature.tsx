import type { ReactNode } from "react";
import { CrownDiamond, Lock } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

import type { PlusReason } from "@/features/subscription/atoms/plusOfferAtom";
import { usePlusOffer } from "@/features/subscription/hooks/useSubscription";
export function LockedFeature({
  reason,
  title,
  description,
  onUpgrade,
  onUpgraded,
  centered = false,
  actions,
}: {
  reason: PlusReason;
  title: string;
  description: string;
  onUpgrade?: () => void;
  onUpgraded?: () => void;
  centered?: boolean;
  /** Replaces the Plus button, e.g. with "Restore dog". */
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const offer = usePlusOffer();
  return (
    <div
      className={
        centered
          ? "flex flex-col items-center gap-3 text-center"
          : "flex flex-col gap-3 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center"
      }
    >
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-accent-soft p-2 text-accent">
          <Lock className={centered ? "size-6" : "size-4"} aria-hidden="true" />
        </span>
        <div className={centered ? "hidden" : "flex flex-col gap-1"}>
          <p className="font-medium">{title}</p>
          <p className="text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
      {centered && (
        <>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="leading-7 text-muted">{description}</p>
        </>
      )}
      {actions ?? (
        <Button
          size="sm"
          variant={centered && reason === "renew" ? "primary" : "secondary"}
          className={centered ? "mt-1" : "w-full shrink-0 sm:ml-auto sm:w-auto"}
          onPress={() => {
            onUpgrade?.();
            offer({ reason, onSuccess: onUpgraded });
          }}
        >
          <CrownDiamond className="size-4" aria-hidden="true" />
          {reason === "renew"
            ? t(($) => $.limits.renew)
            : t(($) => $.subscription.tryPlus)}
        </Button>
      )}
    </div>
  );
}

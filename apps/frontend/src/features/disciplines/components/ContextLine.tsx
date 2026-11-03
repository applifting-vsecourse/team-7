import type { ReactNode } from "react";

/**
 * "🏳 Cíl: Přivolání" — where an item sits in the plan: an icon, a muted
 * label and the parent's name. Used by the library dialogs and the dog's
 * exercise detail so both read the same.
 */
export function ContextLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-sm">
      {icon}
      <span className="text-muted">{label}</span>
      <span className="min-w-0 font-medium wrap-break-word">{value}</span>
    </p>
  );
}

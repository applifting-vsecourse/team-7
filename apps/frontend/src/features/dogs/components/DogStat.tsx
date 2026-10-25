import type { ComponentType, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

/** Figma Dog Stat: icon badge, value and supporting label. */
export function DogStat({
  icon: Icon,
  value,
  label,
  tone = "accent",
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  value: ReactNode;
  label: string;
  tone?: "accent" | "success" | "warning";
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
          {
            "bg-accent-soft text-foreground": tone === "accent",
            "bg-success-soft text-success-soft-foreground": tone === "success",
            "bg-warning-soft text-warning-soft-foreground": tone === "warning",
          },
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-lg leading-7 font-semibold tracking-tight">
          {value}
        </p>
        <p className="text-sm leading-6 text-muted">{label}</p>
      </div>
    </div>
  );
}

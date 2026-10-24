import type { ComponentType, ReactNode, SVGProps } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Icon className="size-8 text-muted" aria-hidden="true" />
      <p className="text-lg leading-7 font-semibold tracking-tight">{title}</p>
      <p className="max-w-prose text-sm leading-6 text-muted">{description}</p>
      {action}
    </div>
  );
}

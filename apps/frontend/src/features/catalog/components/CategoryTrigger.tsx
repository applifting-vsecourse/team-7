import { Accordion } from "@heroui/react";

/** Accordion trigger for a catalog category: its name and a muted description. */
export function CategoryTrigger({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <Accordion.Trigger className="gap-3">
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-base leading-6 font-semibold tracking-tight">
          {name}
        </span>
        <span className="line-clamp-2 text-sm leading-6 font-normal text-muted">
          {description}
        </span>
      </span>
      <Accordion.Indicator />
    </Accordion.Trigger>
  );
}

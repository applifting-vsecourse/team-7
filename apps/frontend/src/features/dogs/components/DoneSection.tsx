import type { ReactNode } from "react";
import { Disclosure } from "@heroui/react";

export function DoneSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Disclosure defaultExpanded className="w-full">
      <Disclosure.Heading>
        {/* The kit's trigger is inline-block, so the block-level chevron SVG
            wrapped onto its own line; keep title and chevron in one row. */}
        <Disclosure.Trigger className="inline-flex items-center gap-2 text-base font-medium">
          {title}
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="pt-2">{children}</Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}

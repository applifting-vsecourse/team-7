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
        <Disclosure.Trigger className="text-base font-medium">
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

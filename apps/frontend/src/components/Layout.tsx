import { type ReactNode } from "react";

import { Header } from "@/components/Header/Header";
import { Seo } from "@/components/Seo";
import { cn } from "@/lib/utils";

export type AppLayoutProps = {
  // Document title; omit it when a nested route sets its own.
  title?: string;
  // Forwarded to the header slot; `null` hides the auth menu.
  userMenu: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
};

/**
 * The app chrome from the Figma "Layout" frame: header above the "Wrapper"
 * row that holds the page content. Every page with a header renders through
 * this, so the frame is defined once.
 */
export default function Layout({
  title,
  userMenu,
  sidebar,
  children,
}: AppLayoutProps) {
  return (
    <>
      <Seo title={title} />
      <Header userMenu={userMenu} showNavigation={!sidebar} />
      {/* Wrapper Figma component */}
      <main
        className={cn(
          "flex w-full flex-1 px-4 pb-4",
          sidebar
            ? "min-h-0 flex-col items-stretch bg-background md:flex-row"
            : "items-start",
        )}
      >
        {sidebar}
        {children}
      </main>
    </>
  );
}

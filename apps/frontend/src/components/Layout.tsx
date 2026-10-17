import { type ReactNode } from "react";
import { useMediaQuery } from "@heroui/react";

import { Header } from "@/components/Header/Header";
import { MobileSidebar } from "@/components/MobileSidebar";
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
  const isMobile = useMediaQuery("(max-width: 767px)");
  return (
    <>
      <Seo title={title} />
      <Header
        userMenu={userMenu}
        showNavigation={!sidebar}
        compactLogo={Boolean(sidebar) && isMobile}
        sidebarToggle={
          sidebar && isMobile ? (
            <MobileSidebar>{sidebar}</MobileSidebar>
          ) : undefined
        }
      />
      {/* Wrapper Figma component */}
      <main
        className={cn(
          "flex w-full flex-1 px-2 pb-2 md:px-4 md:pb-4",
          sidebar
            ? "min-h-0 flex-col items-stretch bg-background md:flex-row"
            : "items-start",
        )}
      >
        {!isMobile && sidebar}
        {children}
      </main>
    </>
  );
}

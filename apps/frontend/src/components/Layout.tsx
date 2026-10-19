import { type ReactNode } from "react";
import { useMediaQuery } from "@heroui/react";

import { Header } from "@/components/Header/Header";
import { MobileSidebar } from "@/components/MobileSidebar";
import { Seo } from "@/components/Seo";
import { cn } from "@/lib/utils";

export type AppLayoutProps = {
  // Document title; omit it when a nested route sets its own.
  title?: string;
  sidebar?: ReactNode;
  // Hide the auth menu (sign-in CTA / user dropdown), e.g. on auth pages.
  showMenu?: boolean;
  // Extra classes for the <main> wrapper, e.g. to override its padding.
  className?: string;
  children: ReactNode;
};

/**
 * The app chrome from the Figma "Layout" frame: header above the "Wrapper"
 * row that holds the page content. Every page with a header renders through
 * this, so the frame is defined once.
 */
export default function Layout({
  title,
  sidebar,
  showMenu = true,
  className,
  children,
}: AppLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return (
    <>
      <Seo title={title} />
      <Header
        compactLogo={isMobile}
        showMenu={showMenu}
        sidebarToggle={
          sidebar && isMobile ? (
            <MobileSidebar>{sidebar}</MobileSidebar>
          ) : undefined
        }
      />
      {/* Wrapper Figma component */}
      <main
        className={cn(
          "flex w-full flex-1",
          sidebar
            ? "max-w-content flex-col items-stretch bg-background md:flex-row"
            : "items-start justify-center",
          className,
        )}
      >
        {!isMobile && sidebar}
        {children}
      </main>
    </>
  );
}

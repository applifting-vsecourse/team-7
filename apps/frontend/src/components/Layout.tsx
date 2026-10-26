import { type ReactNode } from "react";
import { useMediaQuery } from "@heroui/react";

import { Header } from "@/components/Header/Header";
import { MobileSidebar } from "@/components/MobileSidebar";
import { Seo } from "@/components/Seo";
import { cn } from "@/lib/utils";

import { VerifyEmailBanner } from "@/features/auth/components/VerifyEmailBanner";
import { AddDogDialog } from "@/features/dogs/components/AddDogDialog";

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
      {/* Keep the desktop sidebar outside the scrolling page content. */}
      <div
        className={cn(
          "flex min-h-0 w-full flex-1",
          sidebar && "max-w-content md:h-[calc(100dvh-4rem)] md:flex-none",
        )}
      >
        {sidebar && !isMobile && (
          <div className="sticky top-16 bottom-4 z-20 ml-4 hidden w-sidebar md:block">
            {sidebar}
          </div>
        )}
        {/* The Figma "Content" column: notices sit above the page, aligned with it. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <VerifyEmailBanner />
          <main
            className={cn(
              "flex min-w-0 flex-1",
              sidebar
                ? "flex-col items-stretch bg-background md:min-h-0 md:flex-row md:items-start md:overflow-y-auto md:[&>section]:min-h-full"
                : "items-start justify-center",
              className,
            )}
          >
            {children}
          </main>
        </div>
      </div>
      {/* Outside the sidebar, so switching to the mobile drawer keeps it open. */}
      {sidebar ? <AddDogDialog /> : null}
    </>
  );
}

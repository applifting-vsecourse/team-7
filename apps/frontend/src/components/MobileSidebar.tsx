import { createContext, type ReactNode, useState } from "react";
import { Bars, Xmark } from "@gravity-ui/icons";
import { Button, Modal } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { HeaderLogo } from "@/components/Header/HeaderLogo";

export const CloseMobileSidebarContext = createContext<
  (() => void) | undefined
>(undefined);

export function MobileSidebar({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        isIconOnly
        variant="secondary"
        className="size-10 min-w-10 rounded-3xl"
        aria-label={t(($) => $.navigation.openMenu)}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "mobile-sidebar" : undefined}
      >
        <Bars className="size-4" aria-hidden="true" />
      </Button>
      <Modal.Backdrop className="justify-start bg-black/50">
        <Modal.Container
          placement="top"
          className="mobile-sidebar w-full max-w-sidebar flex-none items-stretch p-0 sm:w-full sm:p-0"
        >
          <Modal.Dialog
            id="mobile-sidebar"
            aria-label={t(($) => $.navigation.main)}
            className="h-full max-w-none gap-6 overflow-y-auto rounded-l-none rounded-r-3xl bg-background p-4 shadow-none"
          >
            <div className="flex shrink-0 items-center justify-between">
              <HeaderLogo size="lg" iconOnly />
              <Button
                isIconOnly
                variant="secondary"
                className="size-10 min-w-10 rounded-3xl text-accent-soft-foreground"
                aria-label={t(($) => $.navigation.closeMenu)}
                onPress={() => setIsOpen(false)}
              >
                <Xmark className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <CloseMobileSidebarContext value={() => setIsOpen(false)}>
              {children}
            </CloseMobileSidebarContext>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

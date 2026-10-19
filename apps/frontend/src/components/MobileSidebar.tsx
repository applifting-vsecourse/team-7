import { type ReactNode } from "react";
import { Bars, Xmark } from "@gravity-ui/icons";
import { Button, Modal } from "@heroui/react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";
import { HeaderLogo } from "@/components/Header/HeaderLogo";

export function MobileSidebar({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useAtom(mobileSidebarOpenAtom);

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
            className="h-full max-w-none gap-6 overflow-hidden rounded-l-none rounded-r-3xl bg-surface p-4 shadow-none"
          >
            <div className="flex shrink-0 items-center justify-between">
              <HeaderLogo iconOnly />
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
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {children}
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

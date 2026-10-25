import { type ReactNode } from "react";
import { Bars, Xmark } from "@gravity-ui/icons";
import { Button, Drawer } from "@heroui/react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";
import { HeaderLogo } from "@/components/Header/HeaderLogo";

export function MobileSidebar({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useAtom(mobileSidebarOpenAtom);

  return (
    <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
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
      <Drawer.Backdrop variant="blur">
        <Drawer.Content placement="left">
          <Drawer.Dialog
            id="mobile-sidebar"
            aria-label={t(($) => $.navigation.main)}
            className="w-sidebar gap-6 overflow-hidden p-4 sm:w-sidebar"
          >
            <Drawer.Header className="shrink-0 flex-row items-center justify-between">
              <HeaderLogo iconOnly />
              <Button
                isIconOnly
                variant="secondary"
                className="size-10 min-w-10 rounded-3xl text-accent-soft-foreground"
                aria-label={t(($) => $.navigation.closeMenu)}
                slot="close"
              >
                <Xmark className="size-4" aria-hidden="true" />
              </Button>
            </Drawer.Header>
            <Drawer.Body className="flex flex-col text-foreground">
              {children}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

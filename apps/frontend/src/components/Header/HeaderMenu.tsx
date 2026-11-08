import {
  ArrowDownToSquare,
  ArrowRightFromSquare,
  Compass,
  Gear,
} from "@gravity-ui/icons";
import { Avatar, Button, buttonVariants, Dropdown, Label } from "@heroui/react";
import { createLink, Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes.ts";

import { useSession } from "@/features/auth/hooks/useSession";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { installGuideOpenAtom } from "@/features/onboarding/atoms/installGuideOpenAtom";
import { useTour } from "@/features/onboarding/hooks/useTour";
import { canAddToHomeScreen } from "@/features/onboarding/lib/install";

const DropdownLink = createLink(Dropdown.Item);

export function HeaderMenu() {
  const { t } = useTranslation();
  const { user } = useSession();
  const signOut = useSignOut();
  const tour = useTour();
  const openInstallGuide = useSetAtom(installGuideOpenAtom);
  // Figma O13: phone browsers we have instructions for, unless already added.
  const canInstall = canAddToHomeScreen();

  if (!user) {
    return (
      <Link
        to={ROUTES.login}
        className={buttonVariants({ size: "sm", variant: "outline" })}
      >
        {t(($) => $.auth.signIn)}
      </Link>
    );
  }

  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dropdown>
      <Button
        variant="ghost"
        isIconOnly
        aria-label={t(($) => $.navigation.userMenu)}
        className="rounded-full"
      >
        <Avatar size="sm" aria-hidden="true">
          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar>
      </Button>
      <Dropdown.Popover placement="bottom end" className="w-48">
        <div className="px-3 py-3">
          <p className="text-sm font-medium">{user.name}</p>
        </div>
        <Dropdown.Menu
          aria-label={t(($) => $.navigation.userActions)}
          onAction={(key) => {
            if (key === "install") openInstallGuide(true);
            else if (key === "tour") tour.go("welcome");
            else if (key === "sign-out" && !signOut.isPending) signOut.mutate();
          }}
        >
          <DropdownLink
            id="settings"
            to={ROUTES.settings}
            textValue={t(($) => $.navigation.settings)}
          >
            <Gear className="size-4" />
            <Label>{t(($) => $.navigation.settings)}</Label>
          </DropdownLink>
          {canInstall ? (
            <Dropdown.Item
              id="install"
              textValue={t(($) => $.onboarding.menu.install)}
            >
              <ArrowDownToSquare className="size-4" />
              <Label>{t(($) => $.onboarding.menu.install)}</Label>
            </Dropdown.Item>
          ) : null}
          <Dropdown.Item
            id="tour"
            textValue={t(($) => $.onboarding.menu.start)}
          >
            <Compass className="size-4" />
            <Label>{t(($) => $.onboarding.menu.start)}</Label>
          </Dropdown.Item>
          <Dropdown.Item
            id="sign-out"
            textValue={t(($) => $.auth.signOut)}
            isDisabled={signOut.isPending}
          >
            <ArrowRightFromSquare className="size-4" />
            <Label>{t(($) => $.auth.signOut)}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

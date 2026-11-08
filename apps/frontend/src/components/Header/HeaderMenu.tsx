import { ArrowRightFromSquare, Gear } from "@gravity-ui/icons";
import { Avatar, Button, buttonVariants, Dropdown, Label } from "@heroui/react";
import { createLink, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes.ts";

import { useSession } from "@/features/auth/hooks/useSession";
import { useSignOut } from "@/features/auth/hooks/useSignOut";

const DropdownLink = createLink(Dropdown.Item);

export function HeaderMenu() {
  const { t } = useTranslation();
  const { user } = useSession();
  const signOut = useSignOut();

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
            if (key === "sign-out" && !signOut.isPending) signOut.mutate();
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

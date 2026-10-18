import { Avatar, Button, buttonVariants, Dropdown, Label } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes.ts";

import { useSession } from "@/features/auth/hooks/useSession";
import { useSignOut } from "@/features/auth/hooks/useSignOut";

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
          <p className="text-xs text-muted">@{user.username}</p>
        </div>
        <Dropdown.Menu
          aria-label={t(($) => $.navigation.userActions)}
          onAction={() => {
            if (!signOut.isPending) signOut.mutate();
          }}
        >
          <Dropdown.Item
            id="sign-out"
            textValue={t(($) => $.auth.signOut)}
            isDisabled={signOut.isPending}
          >
            <LogOut className="size-4" />
            <Label>{t(($) => $.auth.signOut)}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

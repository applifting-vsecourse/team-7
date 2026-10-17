import { buttonVariants } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";

import { ErrorLayout } from "./ErrorLayout";

export function NotFound() {
  const { t } = useTranslation();
  return (
    <ErrorLayout
      title={t(($) => $.errors.notFound.title)}
      description={t(($) => $.errors.notFound.description)}
      action={
        <Link to={ROUTES.home} className={buttonVariants()}>
          {t(($) => $.navigation.goHome)}
        </Link>
      }
    />
  );
}

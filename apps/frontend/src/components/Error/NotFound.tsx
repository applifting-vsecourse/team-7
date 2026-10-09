import { buttonVariants } from "@heroui/react"
import { Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"

import { ErrorLayout } from "./ErrorLayout"

export function NotFound() {
  return (
    <ErrorLayout
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      action={
        <Link
          to={ROUTES.home}
          className={buttonVariants()}
        >
          Go home
        </Link>
      }
    />
  )
}

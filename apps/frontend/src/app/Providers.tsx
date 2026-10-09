import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"

import { router } from "@/app/router"
import { queryClient } from "@/config/react-query"
import { ThemeController } from "@/hooks/useTheme"

export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeController>
        <RouterProvider router={router} />
      </ThemeController>
    </QueryClientProvider>
  )
}

import { createContext, useContext, useState, type ReactNode } from "react"
import { useTheme as useHeroUITheme } from "@heroui/react"

const ThemeContext = createContext<ReturnType<typeof useHeroUITheme> | null>(null)

export function ThemeController({ children }: { children: ReactNode }) {
  // Carry forward preferences saved by the previous theme controller.
  const [defaultTheme] = useState(() => {
    const saved = localStorage.getItem("theme")
    const preference = saved === "light" || saved === "dark" ? saved : "system"
    if (!localStorage.getItem("heroui-theme") && saved) {
      localStorage.setItem("heroui-theme", preference)
    }
    return preference
  })
  const theme = useHeroUITheme(defaultTheme)

  return <ThemeContext value={theme}>{children}</ThemeContext>
}

export function useTheme() {
  const theme = useContext(ThemeContext)
  if (!theme) throw new Error("useTheme must be used within ThemeController")
  return theme
}

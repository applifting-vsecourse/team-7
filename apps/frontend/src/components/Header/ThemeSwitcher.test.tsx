import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeSwitcher } from "@/components/Header/ThemeSwitcher"
import { ThemeController, useTheme } from "@/hooks/useTheme"

function ThemeStatus() {
  const { theme, resolvedTheme } = useTheme()
  return (
    <output aria-label="Current theme">
      {theme}/{resolvedTheme}
    </output>
  )
}

function renderTheme() {
  return render(
    <ThemeController>
      <ThemeSwitcher />
      <ThemeStatus />
    </ThemeController>,
  )
}

describe("theme controller and menu", () => {
  let isDark: boolean
  let changes: Set<() => void>

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ""
    document.documentElement.removeAttribute("data-theme")
    isDark = false
    changes = new Set()
    vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
      get matches() {
        return media === "(prefers-color-scheme: dark)" && isDark
      },
      media,
      onchange: null,
      addEventListener: (_event: string, listener: EventListenerOrEventListenerObject) => {
        changes.add(listener as () => void)
      },
      removeEventListener: (_event: string, listener: EventListenerOrEventListenerObject) => {
        changes.delete(listener as () => void)
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  function changeOS(isNextDark: boolean) {
    act(() => {
      isDark = isNextDark
      changes.forEach((listener) => {
        listener()
      })
    })
  }

  it("initializes System without needing a menu and follows OS changes", () => {
    render(
      <ThemeController>
        <ThemeStatus />
      </ThemeController>,
    )
    expect(screen.getByLabelText("Current theme")).toHaveTextContent("system/light")
    changeOS(true)
    expect(document.documentElement).toHaveClass("dark")
    expect(document.documentElement).not.toHaveClass("light")
    expect(document.documentElement).toHaveAttribute("data-theme", "dark")
    changeOS(false)
    expect(document.documentElement).toHaveAttribute("data-theme", "light")
  })

  it("carries forward the old preference, with the HeroUI key taking precedence", () => {
    localStorage.setItem("theme", "dark")
    const view = renderTheme()
    expect(localStorage.getItem("heroui-theme")).toBe("dark")
    expect(screen.getByLabelText("Current theme")).toHaveTextContent("dark/dark")
    view.unmount()
    localStorage.setItem("heroui-theme", "light")
    renderTheme()
    expect(screen.getByLabelText("Current theme")).toHaveTextContent("light/light")
  })

  it("selects by keyboard, indicates the preference, persists and returns focus", async () => {
    const user = userEvent.setup()
    const view = renderTheme()
    const trigger = screen.getByRole("button", { name: "Toggle theme" })
    act(() => trigger.focus())
    await user.keyboard("{ArrowDown}")
    expect(await screen.findByRole("menuitemradio", { name: "System" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
    await user.keyboard("{Home}{ArrowDown}{Enter}")
    await waitFor(() => expect(localStorage.getItem("heroui-theme")).toBe("dark"))
    expect(screen.getByLabelText("Current theme")).toHaveTextContent("dark/dark")
    changeOS(false)
    expect(document.documentElement).toHaveAttribute("data-theme", "dark")
    await waitFor(() => expect(trigger).toHaveFocus())

    await user.click(trigger)
    expect(await screen.findByRole("menuitemradio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())

    view.unmount()
    renderTheme()
    expect(screen.getByLabelText("Current theme")).toHaveTextContent("dark/dark")
    await user.click(screen.getByRole("button", { name: "Toggle theme" }))
    await user.click(await screen.findByRole("menuitemradio", { name: "System" }))
    expect(localStorage.getItem("heroui-theme")).toBe("system")
    changeOS(true)
    expect(screen.getByLabelText("Current theme")).toHaveTextContent("system/dark")
  })
})

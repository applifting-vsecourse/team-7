import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeSwitcher } from "@/components/Header/ThemeSwitcher";
import { ThemeController, useTheme } from "@/hooks/useTheme";

function ThemeStatus() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <output aria-label="Current theme">
      {theme}/{resolvedTheme}
    </output>
  );
}

function renderTheme() {
  return render(
    <ThemeController>
      <ThemeSwitcher />
      <ThemeStatus />
    </ThemeController>,
  );
}

describe("theme controller and switch", () => {
  let isDark: boolean;
  let changes: Set<() => void>;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    isDark = false;
    changes = new Set();
    vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
      get matches() {
        return media === "(prefers-color-scheme: dark)" && isDark;
      },
      media,
      onchange: null,
      addEventListener: (
        _event: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        changes.add(listener as () => void);
      },
      removeEventListener: (
        _event: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        changes.delete(listener as () => void);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  function changeOS(isNextDark: boolean) {
    act(() => {
      isDark = isNextDark;
      changes.forEach((listener) => {
        listener();
      });
    });
  }

  it("initializes System without needing a menu and follows OS changes", () => {
    render(
      <ThemeController>
        <ThemeStatus />
      </ThemeController>,
    );
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "system/light",
    );
    changeOS(true);
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement).not.toHaveClass("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    changeOS(false);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("shows the resolved System theme and lets a dark-system user switch to light", async () => {
    isDark = true;
    const user = userEvent.setup();
    renderTheme();

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("switch", { name: "Dark" })).toBeChecked();
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "system/dark",
    );
    expect(localStorage.getItem("heroui-theme")).toBeNull();

    changeOS(false);
    expect(screen.getByRole("switch", { name: "Light" })).not.toBeChecked();
    changeOS(true);
    expect(screen.getByRole("switch", { name: "Dark" })).toBeChecked();

    await user.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch", { name: "Light" })).not.toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("heroui-theme")).toBe("light");
    changeOS(false);
    changeOS(true);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("carries forward the old preference, with the HeroUI key taking precedence", () => {
    localStorage.setItem("theme", "dark");
    const view = renderTheme();
    expect(localStorage.getItem("heroui-theme")).toBe("dark");
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "dark/dark",
    );
    view.unmount();
    localStorage.setItem("heroui-theme", "light");
    renderTheme();
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "light/light",
    );
  });

  it("toggles by keyboard, indicates the preference, persists and keeps focus", async () => {
    const user = userEvent.setup();
    const view = renderTheme();
    const toggle = screen.getByRole("switch");
    expect(toggle).not.toBeChecked();
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard(" ");
    await waitFor(() =>
      expect(localStorage.getItem("heroui-theme")).toBe("dark"),
    );
    expect(toggle).toBeChecked();
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "dark/dark",
    );
    changeOS(true);
    changeOS(false);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(toggle).toHaveFocus();

    view.unmount();
    renderTheme();
    expect(screen.getByRole("switch")).toBeChecked();
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "dark/dark",
    );
    await user.click(screen.getByRole("switch"));
    expect(localStorage.getItem("heroui-theme")).toBe("light");
    expect(screen.getByRole("switch")).not.toBeChecked();
    changeOS(true);
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "light/light",
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("syncs preferences from another tab and follows System after storage is cleared", () => {
    renderTheme();
    act(() => {
      localStorage.setItem("heroui-theme", "dark");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "heroui-theme",
          newValue: "dark",
          storageArea: localStorage,
        }),
      );
    });
    expect(screen.getByRole("switch")).toBeChecked();
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "dark/dark",
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    act(() => {
      localStorage.clear();
      window.dispatchEvent(
        new StorageEvent("storage", { storageArea: localStorage }),
      );
    });
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "system/light",
    );
    changeOS(true);
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "system/dark",
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("falls back to System for an invalid saved preference", () => {
    localStorage.setItem("heroui-theme", "invalid");
    renderTheme();
    expect(screen.getByLabelText("Current theme")).toHaveTextContent(
      "system/light",
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.documentElement).not.toHaveClass("invalid");
  });
});

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { keyFromSelector } from "i18next";
import { useTranslation } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Seo } from "@/components/Seo";
import i18n from "@/i18n";
import { messageSelectors, translateMessage } from "@/i18n/messages";

import { SignInForm } from "@/features/auth/components/SignInForm";

import cs from "./cs.json";
import en from "./en.json";

function LoginTitle() {
  const { t } = useTranslation();
  return <Seo title={t(($) => $.auth.signIn)} />;
}

afterEach(async () => {
  window.history.replaceState(null, "", "/");
  await i18n.changeLanguage("en");
});

describe("localization", () => {
  it("provides matching, nonempty Czech and English catalogs", () => {
    type Catalog = { [key: string]: string | Catalog };
    function entries(catalog: Catalog, prefix = ""): [string, string][] {
      return Object.entries(catalog).flatMap(([key, value]) => {
        expect(key).toMatch(/^[a-z][a-zA-Z]*$/);
        const path = prefix ? `${prefix}.${key}` : key;
        return typeof value === "string"
          ? [[path, value] as [string, string]]
          : entries(value, path);
      });
    }
    const czech = entries(cs);
    const english = entries(en);
    expect(czech.map(([key]) => key).sort()).toEqual(
      english.map(([key]) => key).sort(),
    );
    for (const [key, value] of [...czech, ...english]) {
      expect(key).toContain(".");
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it("updates form text, existing validation, document language and title when switching", async () => {
    render(
      <>
        <LoginTitle />
        <SignInForm isLoading={false} onSubmit={vi.fn()} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    await act(async () => {
      await i18n.changeLanguage("cs");
    });
    expect(
      screen.getByRole("button", { name: "Přihlásit se" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toHaveAccessibleDescription(
      "Zadejte e-mail",
    );
    expect(document.documentElement.lang).toBe("cs");
    expect(document.title).toBe("Přihlásit se • TrainLoop");
    expect(localStorage.getItem("i18nextLng")).toBe("cs");
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });

  it("translates stored fallback keys through selectors and preserves API messages", async () => {
    const signInError = keyFromSelector(messageSelectors.signInFailed);
    expect(translateMessage(i18n.t, signInError)).toBe("Sign in failed");
    await i18n.changeLanguage("cs");
    expect(translateMessage(i18n.t, signInError)).toBe(
      "Přihlášení se nezdařilo",
    );
    expect(
      translateMessage(i18n.t, keyFromSelector(messageSelectors.signUpFailed)),
    ).toBe("Registrace se nezdařila");
    expect(
      translateMessage(i18n.t, keyFromSelector(messageSelectors.resetFailed)),
    ).toBe("Odkaz pro obnovení se nepodařilo odeslat");
    expect(translateMessage(i18n.t, "Invalid credentials")).toBe(
      "Invalid credentials",
    );
  });

  it("defaults to Czech without an explicit language preference", async () => {
    localStorage.removeItem("i18nextLng");
    await i18n.changeLanguage();
    expect(i18n.resolvedLanguage).toBe("cs");
    expect(document.documentElement.lang).toBe("cs");
  });

  it("detects URL preferences, persists them and falls back for unsupported languages", async () => {
    window.history.replaceState(null, "", "/?lng=en");
    await i18n.changeLanguage();
    expect(i18n.resolvedLanguage).toBe("en");
    window.history.replaceState(null, "", "/");
    await i18n.changeLanguage();
    expect(i18n.resolvedLanguage).toBe("en");
    await i18n.changeLanguage("de");
    expect(i18n.resolvedLanguage).toBe("cs");
  });

  it("resolves regional Czech", async () => {
    await i18n.changeLanguage("cs-CZ");
    expect(i18n.resolvedLanguage).toBe("cs");
  });
});

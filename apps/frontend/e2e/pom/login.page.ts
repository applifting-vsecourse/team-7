import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(readonly page: Page) {}

  get heading() {
    return this.page.getByRole("heading", {
      name: "Sign in",
      exact: true,
    });
  }
  get czechHeading() {
    return this.page.getByRole("heading", {
      name: "Přihlášení",
      exact: true,
    });
  }
  get email() {
    return this.page.getByRole("textbox", {
      name: "Email",
      exact: true,
    });
  }
  get password() {
    return this.page.getByLabel("Password", { exact: true });
  }
  get submit() {
    return this.page.getByRole("button", {
      name: "Sign in",
      exact: true,
    });
  }
  get czechSubmit() {
    return this.page.getByRole("button", {
      name: "Přihlásit se",
      exact: true,
    });
  }
  get emailRequired() {
    return this.page.getByText("Zadejte e-mail", {
      exact: true,
    });
  }
  get passwordRequired() {
    return this.page.getByText("Zadejte heslo", {
      exact: true,
    });
  }
  get invalidCredentials() {
    return this.page.getByText("Invalid email or password", { exact: true });
  }

  async goto(language: "cs" | "en" = "en") {
    await this.page.goto(language === "cs" ? "/login" : "/login?lng=en");
  }

  async signIn(email: string, password: string) {
    await this.goto();
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}

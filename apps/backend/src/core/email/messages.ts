export const emailMessages = {
  cs: {
    fallbackLink:
      "Pokud tlačítko nefunguje, zkopírujte tento odkaz do prohlížeče:",
    resetPassword: {
      subject: "Obnovení hesla",
      preview: "Obnovte své heslo do TrainLoop",
      heading: "Obnovení hesla",
      description: (name: string) =>
        `Dobrý den, ${name}, obdrželi jsme žádost o obnovení vašeho hesla do TrainLoop. Kliknutím na tlačítko níže si nastavíte nové heslo.`,
      button: "Nastavit nové heslo",
      disclaimer:
        "Pokud jste o obnovení hesla nežádali, můžete tento e-mail ignorovat. Vaše heslo zůstane stejné.",
    },
    verifyEmail: {
      subject: "Ověření e-mailové adresy",
      preview: "Ověřte svou e-mailovou adresu pro TrainLoop",
      heading: "Vítejte v TrainLoop",
      description:
        "Kliknutím na tlačítko níže ověříte svou e-mailovou adresu a dokončíte nastavení účtu.",
      button: "Ověřit e-mail",
      disclaimer:
        "Pokud jste si účet v TrainLoop nevytvořili, můžete tento e-mail ignorovat.",
    },
  },
  en: {
    fallbackLink:
      "If the button doesn't work, copy and paste this link into your browser:",
    resetPassword: {
      subject: "Password reset",
      preview: "Reset your TrainLoop password",
      heading: "Reset your password",
      description: (name: string) =>
        `Hi ${name}, we received a request to reset your TrainLoop password. Click the button below to choose a new one.`,
      button: "Reset password",
      disclaimer:
        "If you didn't request a password reset, you can safely ignore this email — your password will stay the same.",
    },
    verifyEmail: {
      subject: "Verify your email address",
      preview: "Verify your TrainLoop email address",
      heading: "Welcome to TrainLoop",
      description:
        "Tap the button below to verify your email address and finish setting up your account.",
      button: "Verify email",
      disclaimer:
        "If you didn't create a TrainLoop account, you can safely ignore this email.",
    },
  },
};

export type EmailLanguage = keyof typeof emailMessages;

// Email links wrap the frontend callback, which carries the selected language.
export function emailLanguageFromUrl(url: string): EmailLanguage {
  const link = new URL(url);
  const callback = link.searchParams.get("callbackURL");
  const destination = callback ? new URL(callback, link.origin) : link;
  return destination.searchParams.get("lng") === "en" ? "en" : "cs";
}

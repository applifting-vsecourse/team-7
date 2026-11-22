export const emailMessages = {
  cs: {
    emailChangeNotice: {
      subject: "Upozornění na změnu e-mailu",
      preview: "Žádost o změnu e-mailu v TrainLoop",
      heading: "Změna e-mailové adresy",
      description: (email: string) =>
        `Pro váš účet byla vyžádána změna e-mailu na ${email}.`,
      button: "Zkontrolovat účet",
      disclaimer:
        "Pokud jste o změnu nežádali, přihlaste se původním e-mailem, zrušte změnu v nastavení a změňte heslo.",
      trialEnding: {
        subject: "Zkušební doba Plus končí zítra",
        description:
          "Zaplaťte, ať vám zůstanou všichni psi, videa a statistiky. Jinak přejdete na verzi Zdarma. Nic se nesmaže.",
        button: "Zaplatit Plus",
      },
      tagline: "Plánovač a tréninkový deník pro psa",
      unsubscribe: "Odhlásit e-mailové připomínky",
      dailyReminder: {
        subject: "Dnes máte naplánovaný trénink",
        heading: "Čas na dnešní trénink",
        description:
          "Na dnešek máte v TrainLoop naplánovaná cvičení. Otevřete si přehled a podívejte se na svůj plán.",
        link: "Zobrazit dnešní plán",
        label: "Váš dnešní trénink",
        encouragement: "Každý společný trénink je krok vpřed.",
        footer:
          "Tuto připomínku dostáváte, protože máte na dnešek naplánovaná cvičení v TrainLoop.",
      },
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
      emailChangeNotice: {
        subject: "Email change requested",
        preview: "A request to change your TrainLoop email",
        heading: "Email address change",
        description: (email: string) =>
          `A change of your account email was requested to ${email}.`,
        button: "Review account",
        disclaimer:
          "If you did not request this change, sign in with your original email, cancel the change in settings, and change your password.",
        trialEnding: {
          subject: "Your Plus trial ends tomorrow",
          description:
            "Pay to keep all your dogs, videos and statistics. Otherwise you will switch to Free. Nothing will be deleted.",
          button: "Pay for Plus",
        },
        tagline: "A planner and training journal for your dog",
        unsubscribe: "Unsubscribe from email reminders",
        dailyReminder: {
          subject: "You have training planned for today",
          heading: "Time for today's training",
          description:
            "You have exercises scheduled for today in TrainLoop. Open your overview to see your plan.",
          link: "View today's plan",
          label: "Your training today",
          encouragement: "Every training session together is a step forward.",
          footer:
            "You're receiving this reminder because you have exercises scheduled for today in TrainLoop.",
        },
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

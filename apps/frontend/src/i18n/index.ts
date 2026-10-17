import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import cs from "./cs.json";
import en from "./en.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { cs: { translation: cs }, en: { translation: en } },
    supportedLngs: ["cs", "en"],
    fallbackLng: "cs",
    load: "languageOnly",
    enableSelector: "optimize",
    keySeparator: ".",
    nsSeparator: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["querystring", "localStorage"],
      lookupQuerystring: "lng",
      caches: ["localStorage"],
    },
  });

function updateDocumentLanguage() {
  document.documentElement.lang = i18n.resolvedLanguage ?? "cs";
}

i18n.on("languageChanged", updateDocumentLanguage);
updateDocumentLanguage();

export default i18n;

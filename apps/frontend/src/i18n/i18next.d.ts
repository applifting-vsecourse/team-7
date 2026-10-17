import "i18next";
import type en from "./en.json";

declare module "i18next" {
  // Module augmentation must merge with i18next’s existing interface.
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface CustomTypeOptions {
    defaultNS: "translation";
    enableSelector: "optimize";
    resources: {
      translation: typeof en;
    };
  }
}

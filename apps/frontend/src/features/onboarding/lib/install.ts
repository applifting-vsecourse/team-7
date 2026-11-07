// Adding TrainLoop to the home screen (Figma O10/O11). iOS can't install from
// the web, so iPhone gets instructions; Chrome hands over its own prompt.
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

let installPrompt: InstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep Chrome's prompt for the tour's Install button.
    event.preventDefault();
    installPrompt = event as InstallPromptEvent;
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
  });
}

export const canPromptInstall = () => installPrompt !== null;

export async function promptInstall() {
  const prompt = installPrompt;
  installPrompt = null;
  await prompt?.prompt();
}

/** Already running from the home screen: the install step is skipped. */
export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac.
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

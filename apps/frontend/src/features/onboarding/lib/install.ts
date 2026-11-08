// Adding TrainLoop to the home screen (Figma O10/O11). It stays a website; the
// tour only shows where each phone browser hides "Add to home screen".
/** Already running from the home screen. */
export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export type HomeScreenBrowser =
  | "safari"
  | "chromeIos"
  | "edgeIos"
  | "chromeAndroid"
  | "edgeAndroid";

/**
 * The phone browser we have matching instructions for; anything else (other
 * browsers, in-app browsers, tablets, desktops) gets no install step.
 */
export function homeScreenBrowser(
  userAgent = navigator.userAgent,
): HomeScreenBrowser | null {
  if (/iPhone|iPod/.test(userAgent)) {
    if (/CriOS\//.test(userAgent)) return "chromeIos";
    if (/EdgiOS\//.test(userAgent)) return "edgeIos";
    // Real Safari has "Version/…Safari/"; other iOS browsers and in-app views add their own token.
    if (
      /Version\/[\d.]+.*Safari\//.test(userAgent) &&
      !/FxiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line\//.test(userAgent)
    ) {
      return "safari";
    }
    return null;
  }
  // Android phones say "Mobile"; "; wv)" is an app's embedded WebView.
  if (/Android/.test(userAgent) && /Mobile/.test(userAgent)) {
    if (/; wv\)/.test(userAgent)) return null;
    if (/EdgA\//.test(userAgent)) return "edgeAndroid";
    if (
      /Chrome\//.test(userAgent) &&
      !/SamsungBrowser|OPR\/|YaBrowser|Firefox|DuckDuckGo|UCBrowser/.test(
        userAgent,
      )
    ) {
      return "chromeAndroid";
    }
  }
  return null;
}

/** The install step and the menu item only show where we can guide the user. */
export const canAddToHomeScreen = () =>
  homeScreenBrowser() !== null && !isStandalone();

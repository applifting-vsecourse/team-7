import { describe, expect, it } from "vitest";

import { homeScreenBrowser } from "./install";

const iphone =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)";
const android =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko)";

describe("home screen instructions", () => {
  it.each([
    [`${iphone} Version/18.5 Mobile/15E148 Safari/604.1`, "safari"],
    [`${iphone} CriOS/138.0.7204.156 Mobile/15E148 Safari/604.1`, "chromeIos"],
    [
      `${iphone} EdgiOS/138.0.3351.83 Version/18.0 Mobile/15E148 Safari/604.1`,
      "edgeIos",
    ],
    [`${android} Chrome/138.0.7204.157 Mobile Safari/537.36`, "chromeAndroid"],
    [
      `${android} Chrome/138.0.7204.157 Mobile Safari/537.36 EdgA/138.0.3351.83`,
      "edgeAndroid",
    ],
  ])("match the phone browser: %s", (userAgent, browser) => {
    expect(homeScreenBrowser(userAgent)).toBe(browser);
  });

  it.each([
    // Firefox and in-app browsers on iPhone
    `${iphone} FxiOS/140.0 Mobile/15E148 Safari/605.1.15`,
    `${iphone} Mobile/15E148 [FBAN/FBIOS;FBAV/500.0]`,
    // Other Android browsers, an app's WebView and a tablet
    `${android} SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36`,
    "Mozilla/5.0 (Android 14; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0",
    `${android.replace(")", "; wv)")} Version/4.0 Chrome/138.0 Mobile Safari/537.36`,
    "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36",
    // iPad and desktop
    "Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36",
  ])("skip browsers without instructions: %s", (userAgent) => {
    expect(homeScreenBrowser(userAgent)).toBeNull();
  });
});

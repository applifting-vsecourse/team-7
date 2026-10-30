import * as matchers from "@testing-library/jest-dom/matchers";
import { beforeEach, expect, vi } from "vitest";

import i18n from "@/i18n";

expect.extend(matchers);

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

// jsdom has no layout engine or media-query implementation. Keep the real
// HeroUI/React Aria controls and supply only the missing browser primitives.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((media: string) => ({
    matches: false,
    media,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

globalThis.ResizeObserver = class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};
Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();

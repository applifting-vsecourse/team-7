import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import "vitest";

// jest-dom 7's /vitest entry point still augments the pre-Vitest 5 Assertion type.
declare module "vitest" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- Vitest matchers require declaration merging.
  interface Matchers<R, T> extends TestingLibraryMatchers<unknown, R> {}
}

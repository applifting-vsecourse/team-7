import { type ParsedLocation } from "@tanstack/react-router";

export const encodeRedirectUri = (location: ParsedLocation) =>
  encodeURIComponent(location.href);

// OAuth callbacks need absolute frontend URLs (relative ones resolve against
// the auth server); the current `lng` is carried over so the language survives.
export const toAbsoluteUrl = (path: string) => {
  const url = new URL(path, window.location.origin);
  const lng = new URLSearchParams(window.location.search).get("lng");
  if (lng && !url.searchParams.has("lng")) url.searchParams.set("lng", lng);
  return url.href;
};

export const decodeRedirectUri = (encoded: string) => {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return "/";
  }
};

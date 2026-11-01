import {
  defaultParseSearch,
  type ParsedLocation,
} from "@tanstack/react-router";

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

// Email callbacks are resolved against FRONTEND_URL by the backend.
export const toRelativeUrl = (path: string) => {
  const url = new URL(toAbsoluteUrl(path));
  return `${url.pathname}${url.search}${url.hash}`;
};

export const verificationRedirect = (from?: string) => {
  try {
    const path = from ? decodeRedirectUri(from) : "/overview";
    const url = new URL(path, window.location.origin);
    return url.origin === window.location.origin &&
      url.pathname !== "/verify-email"
      ? `${url.pathname}${url.search}${url.hash}`
      : "/overview";
  } catch {
    return "/overview";
  }
};

// Router `to` accepts a pathname; search and hash must be passed separately.
export const toNavigationOptions = (path: string) => {
  const url = new URL(toAbsoluteUrl(path));
  return {
    to: url.pathname,
    search: defaultParseSearch(url.search),
    hash: url.hash.slice(1),
  };
};

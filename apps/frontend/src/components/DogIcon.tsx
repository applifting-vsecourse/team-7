import type { SVGProps } from "react";

/** Custom dog glyph on the same 16px grid as the Gravity icons. */
export function DogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M4 7v3.5a4 4 0 0 0 8 0V7" />
      <path d="m6 3.5-.8-.7c-.8-.6-1.8-.3-2.2.7L1.5 7c-.5 1.2 0 2 1.25 2H4M10 3.5l.8-.7c.8-.6 1.8-.3 2.2.7L14.5 7c.5 1.2 0 2-1.25 2H12M6 3.5a6 6 0 0 1 4 0" />
      <path d="M8 11v1" />
      <path d="m7 10 1 1 1-1Z" fill="currentColor" stroke="none" />
      <circle cx="6" cy="7.5" r=".75" fill="currentColor" stroke="none" />
      <circle cx="10" cy="7.5" r=".75" fill="currentColor" stroke="none" />
    </svg>
  );
}

# Design contract

Read this before writing or changing any UI — human or agent.

These are rules, not suggestions. When a rule and a "nicer looking" idea disagree, the rule wins. Consistency across every screen beats a clever one.

Controls come directly from `@heroui/react` (HeroUI v3). Use its accessible compound components rather than vendoring or hand-rolling controls.

**Tokens enter through `apps/frontend/src/styles/global.css`.** It imports Tailwind 4 followed by `@heroui/styles`, whose default light/dark themes are the source of truth for colour, radius, fields, focus and shadows. Keep the default palette; local font configuration preserves Geist. This file says how to _use_ the tokens.

## Colour

- **Never hardcode a colour.** No `#hex`, no `bg-blue-500`, no `rgb()`. Use HeroUI semantic classes: `bg-background`, `text-foreground`, `text-muted`, `bg-surface`, `bg-overlay`, `bg-accent`, `bg-default`, `border-border`, `text-danger`.
- **`primary` buttons use the `accent` action token.** One primary button per view. Everything else is `outline`, `ghost`, `secondary` or a plain link.
- **`danger` only for destructive actions and errors.** Never for emphasis.
- Keep HeroUI's built-in hover/active colours, field tokens and focus states. `accent` is the action colour; `default` is a neutral surface.
- Body text is `foreground`; supporting text is `muted`. There is no third level.

## Layout

- **Cards are for separable items in a list** — a quack, a search result, a product. They are not page sections and not layout tools.
- **Never nest a card inside a card.** If content needs grouping inside a card, use spacing and a hairline divider.
- **A page is not a card.** Page content sits on `background` in a centred column (`max-w-2xl` for reading, `max-w-4xl` for wide layouts), not inside a floating panel.
- **Every page keeps the app chrome.** The header is present on every route, including login and sign-up. Pages never render as standalone islands.
- Forbidden by default: the centred-hero-plus-three-feature-cards layout, carousels, and any section whose only purpose is to look full.

## Spacing

Use the scale only: `1, 2, 3, 4, 6, 8, 12, 16` (Tailwind units — 4px…64px). No arbitrary values like `p-[13px]`. Related things get `gap-2`/`gap-3`; separate blocks get `gap-6`/`gap-8`.

## Type

- One `h1` per page. Headings step down without skipping.
- Sizes come from the scale: `text-sm` supporting, `text-base` body, `text-lg`/`text-xl` subheads, `text-2xl`+ page titles. Headings get `tracking-tight`; body does not.
- Sentence case everywhere. No ALL CAPS except a single small label style (`text-xs uppercase tracking-widest`), used sparingly.

## Surfaces

- **Borders are hairlines**: `border border-border`. One border, not two adjacent ones.
- **Shadows are rare.** Only for things that genuinely float above the page — dropdowns, dialogs, toasts. Cards and inputs do not get shadows.
- HeroUI inputs, textareas and cards get `shadow-none`; floating components retain the kit's overlay shadows.
- Radius comes from the token (`rounded-lg`/`rounded-md`). Never mix radii in one component.

## Forms

- Every input has a visible `<label>`. Placeholders are examples, never labels.
- Validation runs client-side _and_ server-side. The client message appears under the field.
- Compose HeroUI `Form`, `TextField`, `Label` and `FieldError` with React Hook Form and Zod (`validationBehavior="aria"`). Keep the input ref for invalid-field focus and let HeroUI associate labels and errors.
- The submit button shows a pending state and is disabled while submitting.
- Never disable a submit button just because the form is untouched — let the user try and show them what's wrong.

## Every list has three states

Loading, empty, and error — all three, always. An empty list renders an empty state with one sentence saying what would appear here, not a blank area. An error renders the message and a way to retry.

Data refreshes itself: refetch when the tab regains focus, and invalidate the query after a mutation. A manual "reload" button in normal UI means one of those is missing — retry belongs in the error state only.

## Accessibility (the floor, not the ceiling)

- Buttons are `<button>`, links are `<a>`/`<Link>`. Never a `div` with `onClick`.
- Style TanStack Router links with HeroUI `buttonVariants` for button-looking navigation. Use `onPress` for HeroUI actions.
- Every icon-only control has an `aria-label`.
- Focus rings are never removed. If you restyle focus, it must stay clearly visible.
- Text contrast at least 4.5:1 — the tokens are chosen to satisfy this; hardcoded colours are how you break it.

## When you are unsure

Prefer less: fewer borders, fewer boxes, fewer font sizes, more whitespace. If a screen feels plain, the fix is usually better spacing and clearer hierarchy, not another container.

## Extending this file

When a code review keeps repeating the same UI feedback, add it here as a rule. That is the point of the file: expectations live in the repo, not in someone's head.

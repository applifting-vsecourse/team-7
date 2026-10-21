# Design contract

Read this before writing or changing any UI — human or agent.

These are rules, not suggestions. When a rule and a "nicer looking" idea disagree, the rule wins. Consistency across every screen beats a clever one.

Controls come directly from `@heroui/react` (HeroUI v3). Use its accessible compound components rather than hand-rolling controls. The kit's own look (shadows, borders, radius, fields, focus) is the baseline; don't override it per component.

**Tokens enter through `apps/frontend/src/styles/global.css`.** It imports Tailwind 4 followed by `@heroui/styles`, whose light/dark themes are the source of truth for colour, radius, fields, focus and shadows. Project additions (fonts, layout sizes, calendar event tile colours) live there too. Inter is the primary font; `font-lily` is for selected decorative text such as the logo. The Figma file is the visual reference. This file says how to _use_ the tokens.

## Colour

- **Never hardcode a colour.** No `#hex`, no `bg-blue-500`, no `rgb()`. Use semantic classes: `bg-background`, `text-foreground`, `text-muted`, `bg-surface`, `bg-accent`, `bg-default`, `border-border`, `text-danger`, or a token defined in `global.css`.
- **One primary button per view.** Everything else is `outline`, `ghost`, `secondary` or a plain link.
- **`danger` only for destructive actions and errors.** Never for emphasis.
- Body text is `foreground`; supporting text is `muted`. There is no third level.
- Never rely on colour alone to convey state (success, warning, error) — pair it with text or an icon.

## Layout

- **Cards are for separable items in a list** — a dog, an exercise, a training entry. They are not page sections and not layout tools.
- **Never nest a card inside a card.** If content needs grouping inside a card, use spacing and a hairline divider.
- **A page is not a card.** Page content sits on `background`, not inside a floating panel.
- **Every page uses the shared app chrome** (`Layout` / `AuthLayout`). Pages never render as standalone islands.
- Layouts are responsive: usable on a phone, since handlers log training at the training field.
- **Nested pages show HeroUI `Breadcrumbs` above the page title, never a back button.** The trail ends with the current page, e.g. `Disciplíny › Poslušnost` or `Mája › Poslušnost`.
- Forbidden by default: the centred-hero-plus-three-feature-cards layout, carousels, and any section whose only purpose is to look full.

## Spacing

Use the Tailwind scale; no arbitrary values like `p-[13px]` unless a size token in `global.css` exists for it. Related things get `gap-2`/`gap-3`; separate blocks get `gap-6`/`gap-8`.

## Type

- One `h1` per page. Headings step down without skipping.
- Sizes come from the scale: `text-sm` supporting, `text-base` body, `text-lg`/`text-xl` subheads, `text-2xl`+ page titles. Headings get `tracking-tight`; body does not.
- Sentence case everywhere. No ALL CAPS except a single small label style (`text-xs uppercase tracking-widest`), used sparingly.
- Text is localized (Czech and English); layouts must tolerate longer strings without truncating or breaking.

## Surfaces

- **Borders are hairlines**: `border border-border`. One border, not two adjacent ones.
- Radius comes from the token. Never mix radii in one component.

## Forms

- Every input has a visible label. Placeholders are examples, never labels.
- Validation runs client-side _and_ server-side. The client message appears under the field.
- Compose HeroUI `Form`, `TextField`, `Label` and `FieldError` with React Hook Form and Zod (`validationBehavior="aria"`). Keep the input ref for invalid-field focus and let HeroUI associate labels and errors.
- The submit button shows a pending state and is disabled while submitting.
- Never disable a submit button just because the form is untouched — let the user try and show them what's wrong.

## Every list has three states

Loading, empty, and error — all three, always. An empty list renders an empty state with one sentence saying what would appear here, not a blank area. An error renders the message and a way to retry.

Data refreshes itself: refetch when the tab regains focus, and invalidate the query after a mutation. A manual "reload" button in normal UI means one of those is missing — retry belongs in the error state only.

## Accessibility (the floor, not the ceiling)

- Buttons are `<button>`, links are `<a>`/`<Link>`. Never a `div` with `onClick`.
- Use `onPress` for HeroUI actions; button-looking navigation stays an anchor.
- Every icon-only control has an `aria-label`.
- Images that carry meaning have alt text; decorative ones use `alt=""`.
- Focus rings are never removed. If you restyle focus, it must stay clearly visible.
- Text contrast at least 4.5:1 — the tokens are chosen to satisfy this; hardcoded colours are how you break it.

## When you are unsure

Prefer less: fewer borders, fewer boxes, fewer font sizes, more whitespace. If a screen feels plain, the fix is usually better spacing and clearer hierarchy, not another container.

## Extending this file

When a code review keeps repeating the same UI feedback, add it here as a rule. That is the point of the file: expectations live in the repo, not in someone's head.

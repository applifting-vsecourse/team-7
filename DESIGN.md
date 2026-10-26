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
- Placeholders are the bare example value, without a "Např." / "e.g." prefix: `Bára`, not `Např. Bára`.
- Validation runs client-side _and_ server-side. The client message appears under the field.
- Compose HeroUI `Form`, `TextField`, `Label` and `FieldError` with React Hook Form and Zod (`validationBehavior="aria"`). Keep the input ref for invalid-field focus and let HeroUI associate labels and errors.
- The submit button shows a pending state and is disabled while submitting.
- Never disable a submit button just because the form is untouched — let the user try and show them what's wrong.
- Never clip the containers that wrap inputs (no `overflow-hidden` on field groups, columns or dialog bodies). It cuts off the field shadow and the focus ring.

## Dialogs

- **Every dialog surface is `bg-background`**, including delete confirmations. The kit's default dialog surface matches the input colour, so fields would disappear into it.
- **Dialog titles use the Heading 3 style** (`text-2xl font-semibold tracking-tight`). Delete confirmations are the exception and keep the kit's default title.

## Toasts

- Toasts appear at the top centre of the viewport, on desktop and mobile.
- Toasts hug their content up to a maximum width of 460px (on mobile, the screen width minus 16px on each side); longer text wraps.

## Motion

Motion is quiet: it explains a change, it never decorates. Every value lives in `global.css`; components only name a class.

- **Use the shared vocabulary.** `interactive-lift` for clickable cards and card-like options, `animate-enter` for content that appears after loading (empty and error states), `stagger` on a list's parent so its items enter in turn, `period-transition` on content that pages through days or months (one element per view; the navigation passes a `forward`/`back` view transition type). Route changes crossfade on their own. Moments of achievement: `animate-celebrate` on the tile and `animate-pop` on its icon, only when the change happens on screen (not for items that load completed); `stagger-delay` with `--i` sequences pops that aren't siblings. Charts: `draw-in` (with `pathLength="1"`) draws a line, `draw-delay` with `--progress` makes points follow it, `animate-fade` for the area. Inside an `interactive-lift` card, the arrow gets `hover-nudge`. A coloured "done" badge gets `shine` (one sweep on appearance). Headline numbers that summarise a period can count up with `useCountUp` (`src/hooks`) — never numbers inside list items. A tile that opens a dialog grows into it: name the tile only for the morph (`withViewTransition` from `@/lib/motion`, see `Event`), give `Modal.Dialog` the same `transitionName` and `Modal.Container` the `grow-from-trigger` class. A selected item that moves on navigation (active nav link, selected view) gets `transitionName(...)` so the highlight slides. No hand-written `duration-*`, `ease-*` or `@keyframes` in components; if a new kind of motion is needed, add a token or utility to `global.css`.
- **The kit animates itself.** Buttons, dialogs, drawers, popovers, toasts and accordions come with their own motion. Don't override it.
- **Animate only `transform`, `translate` and `opacity`** (plus colour or shadow on state change). Never width, height, top or left.
- **One or two moving things per view.** A page whose every element moves is noise.
- **Reduced motion is automatic** as long as you use the tokens: the system setting and `data-reduce-motion` zero every duration.
- **CSS and the View Transitions API first.** Motion (`motion/react`) is only for what CSS can't do — items entering / leaving a list (`PresenceList` / `PresenceItem` from `src/components/PresenceList.tsx`, which read the same tokens; key the list by period when paging replaces its content) and touch gestures (`SwipePager` in the events feature for swiping calendar periods). Never import `motion.*` directly.
- **List item opens a detail:** give the item's title and the detail heading the same `transitionName("discipline", id)` (from `@/lib/utils`) on an `inline-block` span, and the title morphs across the navigation. A name must be unique on the page.

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

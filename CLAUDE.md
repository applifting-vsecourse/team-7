# Quacker — starter template

Full-stack teaching template: pnpm monorepo with two apps.

- `apps/backend` — NestJS + Prisma + Postgres. Auth: BetterAuth (mounted at `/api/auth/*`, treat as a black box). API docs: Swagger at `/api/docs`.
- `apps/frontend` — React 19 + Vite + TanStack Router/Query, Tailwind 4 + HeroUI v3, `ky` + `zod` API client. Feature folders under `src/features/`.

The worked example is the quack feed: `Quack` model → seed → repository → service → `GET`/`POST /api/quacks` (DTO-validated, author taken from the session) → zod schema → TanStack Query → list page + post form. Copy its pattern for new features.

**Before writing or changing any UI, read [`DESIGN.md`](DESIGN.md).** It is a contract, not a suggestion — it exists to stop generated screens drifting into generic nested cards.

## Commands

- `pnpm dev` — everything: env files, Postgres (Docker), migrate, seed, both dev servers
- `pnpm check-all` — lint + type-check + tests + build (same as CI)
- `pnpm backend test` / `pnpm frontend test:ci` — unit tests
- `pnpm backend prisma:migrations:run` — create/apply migrations after schema changes

## Conventions

Deliberately sparse — this file grows as the team learns what it expects from generated code. Add rules here when you find yourself repeating the same review feedback.

### UI controls come from the kit

Import controls directly from `@heroui/react` and use HeroUI v3 compound APIs (`Alert.Content`, `Avatar.Fallback`, `Dropdown.Menu`). Check current v3 documentation before introducing a component. One accessibility implementation to reason about beats a per-control judgement call.

HeroUI's default light/dark semantic tokens come from `@heroui/styles` in `apps/frontend/src/styles/global.css`. Keep field and focus tokens intact; apply `shadow-none` to inputs, textareas and cards. [`DESIGN.md`](DESIGN.md) keeps shadows for things that genuinely float — dialogs, dropdowns, toasts.

Use `onPress` / `isDisabled` / `isPending` for buttons. Button-looking navigation is a TanStack Router `Link` styled with `buttonVariants`, so it remains an anchor. Forms compose `Form`, `TextField`, `Label`, `Input`/`TextArea`, and `FieldError` with React Hook Form controllers and Zod; put the controller ref on the input for invalid-field focus.

`ThemeController` above the router owns a single native HeroUI `useTheme` instance. The menu consumes its shared state, defaults to System, and persists preferences under `heroui-theme` (carrying over the old `theme` key).

### The app is already running

Assume the dev servers are up. If something is listening on the app's ports, that is this application: use it. Don't start a second instance, don't restart it, don't run `pnpm dev`.

Don't reach for the browser to check your own work. Tests and type-checks are the evidence; open the running app when asked to, not on your own initiative.

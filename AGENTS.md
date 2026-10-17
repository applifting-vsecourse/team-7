# TrainLoop

Training planner and log for dog handlers (Czech-first, English supported). Handlers replace notebooks with a plan per dog → discipline → goal → exercise, a weekly calendar, structured results (successful attempts out of total) and a progress history. Product context: `Docs/lean-canvas-mvp.md` and `Docs/lean-canvas.md` on the `docs` branch.

pnpm monorepo with two apps.

- `apps/backend` — NestJS + Prisma + Postgres. Auth: BetterAuth (mounted at `/api/auth/*`, treat as a black box). API docs: Swagger at `/api/docs`. Layout: `src/core` (infrastructure), `src/shared` (cross-module), `src/modules/<feature>` (controllers, DTOs, domain).
- `apps/frontend` — React 19 + Vite + TanStack Router/Query, Tailwind 4 + HeroUI v3, `ky` + `zod` API client. Feature folders under `src/features/`.

New features copy the pattern of an existing one (e.g. dogs): Prisma model → seed → service → DTO-validated controller (owner taken from the session) → zod schema → TanStack Query options → components.

**Before writing or changing any UI, read [`DESIGN.md`](DESIGN.md).** It is a contract, not a suggestion — it exists to stop generated screens drifting into generic nested cards.

## Commands

- `pnpm dev` — everything: env files, Postgres (Docker), migrate, seed, both dev servers
- `pnpm check` — lint + type-check
- `pnpm check-all` — lint + type-check + tests + build + format check (same as CI)
- `pnpm test` — backend + frontend tests (vitest); add `--project backend` or `--project frontend` to select one app
- `pnpm test:watch` / `pnpm test:cov` — watch tests / generate workspace coverage
- `pnpm backend prisma:migrations:run` — create/apply migrations after schema changes

Linting is oxlint, formatting is oxfmt.

## Conventions

Deliberately sparse — this file grows as the team learns what it expects from generated code. Add rules here when you find yourself repeating the same review feedback.

### Verification

- At the end of every change, run `pnpm check`.
- If you added or modified tests, also run `pnpm check-all`.
- Fix any failures caused by your changes before finishing. Report any remaining failures.

### UI controls come from HeroUI

Import controls directly from `@heroui/react` and use HeroUI v3 compound APIs (`Alert.Content`, `Avatar.Fallback`, `Dropdown.Menu`). What you remember about HeroUI v3 is likely wrong: check the docs before introducing a component. Claude Code: use the `heroui-react` skill / MCP. Other agents: read [`HEROUI.md`](HEROUI.md), a generated index of the docs in `.heroui-docs/react` (gitignored; if the folder is missing, tell the developer the docs are missing and give them the command `pnpm docs:heroui`; never run it yourself). Don't hand-roll a control the kit already has.

Style with the kit's defaults and semantic tokens from `@heroui/styles` (see `apps/frontend/src/styles/global.css`). Don't override the kit's own styling — shadows, borders, radius, field and focus tokens — to match a personal preference; change a token in `global.css` if the design genuinely calls for it. Inter is the primary font; `font-lily` is for selected decorative text such as the logo.

Use `onPress` / `isDisabled` / `isPending` for buttons. Button-looking navigation is a HeroUI `Link` or a TanStack Router `Link` styled with `buttonVariants`, so it remains an anchor. Forms compose `Form`, `TextField`, `Label`, `Input`/`TextArea`, and `FieldError` with React Hook Form controllers and Zod; put the controller ref on the input for invalid-field focus.

`ThemeController` above the router owns a single native HeroUI `useTheme` instance. The menu consumes its shared state, defaults to System, and persists preferences under `heroui-theme`.

### Localization

Czech is the default language, English the second. Every user-visible string goes through i18next (`useTranslation`, typed selectors: `t(($) => $.auth.signIn)`) with matching keys in `src/i18n/cs.json` and `src/i18n/en.json`; never hardcode UI text. Strings produced outside components (zod schemas, errors) are declared in `src/i18n/messages.ts` and translated at render time. Keys are camelCase. The `lng` search param selects the language and must be retained across navigation.

### Frontend state management

TanStack Query for server state (fetching, caching, mutations, refetching). Jotai for shared client state such as selected dog IDs, filters and UI preferences; keep atoms in the feature's `atoms/` directory. State used by one component stays in React state. Don't copy query results into atoms.

### The app is already running

Assume the dev servers are up. If something is listening on the app's ports, that is this application: use it. Don't start a second instance, don't restart it, don't run `pnpm dev`.

Don't reach for the browser to check your own work. Tests and type-checks are the evidence; open the running app when asked to, not on your own initiative.

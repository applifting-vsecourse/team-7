# TrainLoop

Training planner and log for dog handlers, built by team 7 for [4IT580](https://4it580.vse.cz). Handlers replace notebooks with a plan per dog → discipline → goal → exercise, a weekly calendar and structured results with a progress history. Czech first, English supported.

**Stack:** React 19 + Vite + TanStack Router/Query + Jotai + Tailwind 4/HeroUI v3 (frontend) · NestJS + Prisma + PostgreSQL + BetterAuth (backend) · pnpm workspaces.

Product background (lean canvas, interview notes, costs) lives in `Docs/` on the `docs` branch.

## Prerequisites

- Node.js 24 — the version in [`.nvmrc`](.nvmrc). With nvm or fnm, `nvm use` picks it up from anywhere in the repo (they search parent directories), and every `package.json` declares it too, so pnpm warns if you are on an older one.
- pnpm — `corepack enable` picks the version from `package.json`
- Docker (for the database)

## Quick start

```shell
pnpm install
pnpm dev
```

`pnpm dev` does everything: creates `.env` files from examples, starts Postgres in Docker, applies migrations, seeds demo data, and runs both dev servers.

| What               | Where                                                |
| ------------------ | ---------------------------------------------------- |
| Frontend           | http://localhost:3050                                |
| API                | http://localhost:4050/api                            |
| API docs (Swagger) | http://localhost:4050/api/docs                       |
| Auth API docs      | http://localhost:4050/api/auth/reference             |
| DB browser         | `pnpm backend prisma:studio` → http://localhost:5555 |

The ports are deliberately odd — 3050, 4050, and Postgres on 5433 rather than the usual 3000, 4000 and 5432 — so the stack doesn't fight whatever else you have running. They're pinned rather than auto-incremented: the API only accepts requests from the frontend's exact origin, so a port that silently moved would surface as an unexplained CORS error.

Verification/reset emails are printed to the backend terminal (console mailer) unless you configure Resend or SMTP in `apps/backend/.env`.

### HeroUI docs for AI agents

[`HEROUI.md`](HEROUI.md) indexes the HeroUI v3 docs, but the docs themselves are downloaded into `.heroui-docs/` (gitignored), so every developer generates them once after cloning:

```shell
pnpm docs:heroui
```

The CLI warns that React isn't installed because it only looks at the root `package.json`; answer `y` to continue. Re-run it after upgrading `@heroui/react`. Agents won't run this for you — they'll ask.

## Everyday commands

```shell
pnpm check-all                     # lint + type-check + tests + builds (what CI runs)
pnpm ts                            # type-check all workspaces
pnpm check                         # lint + type-check all workspaces
pnpm lint                          # lint with Oxlint
pnpm lint:fix                      # apply lint fixes
pnpm format                        # format files with Oxfmt
pnpm test                          # backend + frontend tests (Vitest)
pnpm test:watch                    # watch tests across both apps
pnpm test --project backend        # run only backend tests
pnpm test --project frontend       # run only frontend tests
pnpm test:cov                      # combined coverage report in coverage/
pnpm backend prisma:migrations:run # create + apply a migration after schema changes
pnpm backend prisma:studio         # browse/edit the database
pnpm backend seed                  # re-seed the database
pnpm dev:down                      # stop the database container
pnpm docs:heroui                   # download HeroUI docs for AI agents (answer y at the React warning)
```

## Linting and formatting

Oxlint uses the root `.oxlintrc.json` with the standard correctness category, built-in TypeScript/React/accessibility/import plugins, and app-specific overrides. Type-aware checks are provided by `oxlint-tsgolint`. Explicit rules retain TanStack Query/Router checks, promise handling, unsafe-type checks, import cycles, restricted imports, and backend explicit-return-type warnings. Generated clients, generated routes, and build output are excluded. This uses Oxlint's defaults rather than an exact copy of the old ESLint presets.

TanStack's ESLint-named plugins are loaded directly by Oxlint; there is no separate ESLint pass. The old custom feature/shared-layer boundaries, double-negation ban, boolean naming, and separate React deprecation/config/gating checks are no longer enforced. TypeScript checks unresolved imports; parent-relative import restrictions and backend DTO boundaries remain lint rules.

Oxfmt uses the root `.oxfmtrc.json` with app-specific overrides. Backend files retain single quotes, semicolons, and an 80-column width; frontend files retain double quotes, optional semicolons, a 100-column width, import groups, and Tailwind 4 stylesheet-aware class sorting (`cn` and `cva`). Markdown and YAML formatting is restored. JSON keys retain their existing order. Formatter output is not guaranteed byte-for-byte identical to Prettier.

Install the recommended Oxc VS Code extension for formatting and lint fixes on save. TypeScript stays on 5.9 for Nest; Oxlint's type-aware engine is a separate dependency.

## Deployment

The whole app ships as one Docker Compose stack — Postgres, the backend, and the frontend (built to static files, served by nginx). See [`docker-compose.yml`](docker-compose.yml).

```shell
cp .env.example .env     # then edit: secrets, and the public URLs
docker compose up --build
```

On **Coolify** (Hetzner): create a Docker Compose resource pointing at this repo, set the variables from `.env.example` in the resource's environment, and assign domains to the `frontend` and `backend` services. Coolify's proxy handles TLS, so the published host ports only matter for local runs.

Two things worth knowing:

- **You set exactly two URLs**, `BACKEND_URL` and `FRONTEND_URL`. The backend uses them for CORS, BetterAuth trusted origins and password-reset links; the frontend's API URL is derived from `BACKEND_URL`. Point them at the real domains or the backend rejects the browser.
- **The frontend bakes its API URL in at build time** (`VITE_*` are build args, not runtime env), so changing `BACKEND_URL` needs a rebuild, not just a restart.
- **Production migrates but does not seed** — the container runs `prisma migrate deploy` then starts. A fresh deployment has an empty database, so the first account is created through the sign-up form.

### https://team-7.vsepractical.applifting.dev

## When something goes wrong

| Symptom                                                  | Cause / fix                                                                                                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev` fails immediately, Docker errors              | Docker Desktop isn't running. Start it and retry.                                                                                                                                    |
| `Port 3050 is already in use`                            | Another app has it. Stop it — the port is pinned on purpose, because the API only accepts requests from `http://localhost:3050`.                                                     |
| Page loads but login fails, console shows a CORS error   | The frontend is on a different port than the API expects. See above.                                                                                                                 |
| `EADDRINUSE :::4050`                                     | An old backend is still running: `lsof -i :4050` then kill the process.                                                                                                              |
| Prisma: "column does not exist" after editing the schema | You changed `schema.prisma` without migrating: `pnpm backend prisma:migrations:run`.                                                                                                 |
| Want the demo data back / a clean database               | `pnpm backend db:reset` — it replays the migrations and re-runs the seed. (Plain `pnpm backend seed` does **not** wipe an existing database; it skips when users are already there.) |
| A commit is blocked by lint or formatting                | The pre-commit hook auto-fixes what it can; fix the rest, or `git commit --no-verify` to bypass it once.                                                                             |
| Browser shows a red error overlay while typing           | That's the type/lint checker, not a crash. Read the message — the app is still running.                                                                                              |

## Layout

```
apps/backend/   NestJS — src/modules (features), src/core, src/shared; prisma/ (schema, migrations)
apps/frontend/  React — src/routes (pages), src/features (feature folders), src/components (shared app components)
```

Working conventions for AI-assisted development: [`AGENTS.md`](AGENTS.md) (`CLAUDE.md` imports it). UI rules every screen must follow: [`DESIGN.md`](DESIGN.md). HeroUI docs for agents: [`HEROUI.md`](HEROUI.md), generated by `pnpm docs:heroui`.

### Frontend state management

TanStack Query (React Query) manages server state: fetching, caching, mutations and refetching API data. Jotai manages shared client state, such as selected dog IDs, filters and UI preferences that do not belong in the query cache. Define atoms in the relevant feature's `atoms/` directory; for example, the overview dog filter uses `src/features/dogs/atoms/selectedDogIdsAtom.ts`. Keep state used by only one component local with React state, and avoid copying query results into atoms.

### Frontend UI and themes

Import accessible controls directly from `@heroui/react`, using HeroUI v3 compound components. Forms retain React Hook Form and Zod validation; navigation uses TanStack Router anchors, with HeroUI `buttonVariants` for button-looking links.

`apps/frontend/src/styles/global.css` imports `@heroui/styles` after Tailwind. HeroUI's default light/dark tokens provide colours, fields, radius and focus states; Inter is the primary font, and Lily Script One is available through `font-lily` for selected decorative text. Use semantic utilities such as `text-muted`, `bg-surface`, and `text-danger`.

The theme menu offers Light, Dark and System (the default). A single `ThemeController` above the router runs HeroUI's native `useTheme`, follows OS changes in System mode, and saves the preference in `localStorage` under `heroui-theme`. Existing preferences from the previous `theme` key are carried forward. Toasts use HeroUI's `Toast.Provider` at the root.

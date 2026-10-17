# 4IT580: Frontend

This app was created using [Vite](https://vitejs.dev/).

It's part of an Applifting educational template that is **free for public use** (see the [LICENSE](../../LICENSE.txt)). Patterns here — data fetching with [ky](https://github.com/sindresorhus/ky), [TanStack Query](https://tanstack.com/query) `queryOptions` + query-key factories, [zod](https://zod.dev/) schemas at the network boundary — follow the [Applifting Frontend Playbook](https://applifting.github.io/frontend-playbook/), kept deliberately small (no codegen, no generated API client) so the moving parts are easy to read.

## Local Installation

Run `pnpm install` in root folder of the monorepo:

```bash
cd ..
pnpm install
cd frontend
```

## Available Scripts

In the project directory, you can run:

### `pnpm dev`

Runs the app in the development mode.\ Open [http://localhost:3050](http://localhost:3050) to view it in the browser.

The page will reload if you make edits.\ You will also see any lint errors in the console.

### `pnpm test`

Launches the test runner in the interactive watch mode.

### `pnpm build`

Builds the app for production to the `build` folder.\ It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\ Your app is ready to be deployed!

## Edit ENV Variables

Copy [`./.env.example`](./.env.example) to `./.env` (or let `pnpm dev` do it for you).

Any variable defined in `.env.local` has priority over `.env`.

Any custom ENV variable that should be accessible in frontend needs an `VITE_` prefix (this is for security).

More about [ENV variables in Vite documentation](https://vitejs.dev/guide/env-and-mode)

### Languages

The app uses [react-i18next](https://react.i18next.com/latest/using-with-hooks)
with English (`en`) and Czech (`cs`) catalogs in `src/i18n/`.
Language selection checks `?lng=cs` or `?lng=en`, the saved `i18nextLng`
local-storage preference, and then the browser language. English is the fallback.
The selected language is remembered across visits. No extra UI is added.

Use `useTranslation()` and typed selectors, e.g. `t(($) => $.auth.signIn)`,
for rendered text. Resource types and `enableSelector: "optimize"` are declared
in `src/i18n/i18next.d.ts`. Validation schemas and fallback errors use
`keyFromSelector(messageSelectors.emailRequired)`; `translateMessage` resolves
these keys through typed selectors when rendering, so existing errors update
when the language changes. API-provided messages remain as received.
Tokens are nested by purpose, such as `auth.signIn`, `auth.reset.title`,
`validation.email.required`, and `errors.notFound.title`.
Quack pages, feed navigation, landing-page copy and sample posts are excluded
from localization. To switch programmatically, import `@/i18n` and call
`await i18n.changeLanguage("cs")` or `await i18n.changeLanguage("en")`.

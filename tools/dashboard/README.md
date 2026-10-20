# Project dashboard

Progress of the TrainLoop project towards the deadline, built from the GitHub issues of this repo: what's done, what's left, by priority, epic and sprint.

Open `index.html` in a browser — no build, no server. It reads the public GitHub API on load (cached for 10 minutes; the API allows 60 unauthenticated requests per hour).

## How it counts

- **Done** = closed issue. Issues labelled `out of scope` or closed as _not planned_ are cut from scope.
- **Priority** comes from the `mvp` / `should` / `nice to have` labels, **epic** from the `epic …` label.
- **Story points** are not stored on GitHub, so they live in `config.js`. Bundled issues share their points evenly. Unestimated issues count as 0 SP; the page says how many are missing.

## Editing

Everything the team changes is in [`config.js`](config.js): sprint dates, the deadline, story points per issue and bundles.

# @ilokesto/utilinent

This standalone repository owns the public `@ilokesto/utilinent` package. Use Node.js 24.22.1 and pnpm 10.17.1.

- Preserve the published 1.3.0 version, `.` and `./hooks` exports, React peer range, source, tests, React 18 fixture, and React 19 declaration fixtures.
- Other ilokesto libraries are registry dependencies pinned by the frozen lock. Only this library and private workspaces inside this repository may use workspace links.
- Tests live in `tests/unit`, `tests/types/react18`, `tests/types/react19`,
  `tests/tooling`, and `tests/browser`; helpers, browser apps, and the isolated
  React 18 package live in `tests/fixtures`.
- Run `pnpm typecheck` for library source and `pnpm test` for the complete gate.
  The gate builds once, then runs `test:unit`, `test:types` (including
  `test:types:react19`), `test:tooling`, `test:react18`, and `test:browser`.
  Standalone declaration checks require `pnpm build` first.
- Update repository and homepage links for this owner.
- Repository-only changes do not bump the package version or add a changeset; the published current version is 1.3.0.
- `release:verify --sha <full-SHA>` is read-only. Pull requests run Verify CI. Main merges create or update a Changesets release PR; merging that PR publishes only the exact successful Verify artifact through GitHub Actions. Enable `Allow GitHub Actions to create and approve pull requests` and configure `NPM_TOKEN` in the `Production` environment before rollout. Never publish locally.

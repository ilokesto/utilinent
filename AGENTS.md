# @ilokesto/utilinent

This standalone repository owns the public `@ilokesto/utilinent` package and its bilingual local documentation site. Use Node.js 22 and pnpm 10.17.1.

- Preserve the published 1.3.0 version, `.` and `./hooks` exports, React peer range, source, tests, React 18 fixture, and React 19 declaration fixtures.
- Canonical current documentation is `docs/`; the local renderer is `website/`. Released documentation and its exact npm artifact are immutable under `docs-publication/releases/utilinent/`.
- Other ilokesto libraries are registry dependencies pinned by the frozen lock. Only this library and private workspaces inside this repository may use workspace links.
- Run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm test:react18`, `pnpm test:browser`, `pnpm typecheck:react19`, `pnpm test:tooling`, `pnpm migrate:verify`, and the docs commands in `BROWSER_TESTING.md`.
- Update repository and homepage links for this owner. Keep migration-only files out of the npm tarball.
- Preserve `.migration/source-manifest.json`, every original archive ref and tag object, and all immutable publication receipts, snapshots, and tarballs.
- Repository migration does not bump the package version or add a changeset; the published current version is 1.3.0.
- `release:verify --sha <full-SHA>` is read-only. Publishing and deployment remain disabled during bootstrap. Never publish locally or deploy docs.

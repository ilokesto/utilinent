# ilokesto

Libraries for state management, forms, React overlays, HTTP requests, and UI utilities.
The eight `@ilokesto` packages share this repository but are versioned and published independently.

## Choose a package

| Package | Use it for |
| --- | --- |
| [@ilokesto/store](packages/store/README.md) | Framework-agnostic state storage and selector subscriptions |
| [@ilokesto/state](packages/state/README.md) | State and reducer primitives with framework bindings |
| [@ilokesto/form](packages/form/README.md) | Headless form state, validation, field arrays, and submission |
| [@ilokesto/overlay](packages/overlay/README.md) | A shared React runtime for layered UI |
| [@ilokesto/modal](packages/modal/README.md) | Modal management built on the overlay runtime |
| [@ilokesto/toast](packages/toast/README.md) | Toast notifications with positioning and auto-dismiss |
| [@ilokesto/fetcher](packages/fetcher/README.md) | Type-safe HTTP requests with OpenAPI support |
| [@ilokesto/utilinent](packages/utilinent/README.md) | React utilities for conditional rendering and async states |

See [PACKAGES.md](PACKAGES.md) for package responsibilities and comparisons,
and [ARCHITECTURE.md](ARCHITECTURE.md) for dependencies and design decisions.

## Use a package

Install the package you need in your application. For example, to use the state container:

```bash
pnpm add @ilokesto/store
```

Each package README above includes installation instructions and usage examples.
You do not need to clone this repository to use the libraries.

The official documentation is available in
[English](https://ilokesto.ayden94.com/en) and
[Korean](https://ilokesto.ayden94.com/ko).
Public package pages document the selected published release; `/next` pages
document the current workspace.

## Develop locally

Use Node.js 22 and the pnpm version pinned in the root
[`package.json`](package.json) `packageManager` field.
Run these commands from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
```

Root build, typecheck, and test commands include the documentation site.
Run typecheck and tests sequentially because some tests rebuild shared distributions.
See the [site guide](apps/docs/README.md) for browser prerequisites and site validation.

For package-specific work, use pnpm filters. For example:

```bash
pnpm --filter @ilokesto/store test
```

### Preview documentation

```bash
pnpm docs:dev
```

This command builds the package dependencies and starts the documentation site.
Open `http://localhost:3000/en` or `http://localhost:3000/ko`.
To preview workspace documentation changes, use `/<language>/<package>/next`.

Edit package content in `packages/<name>/docs/` and site code in `apps/docs/`.
The private documentation app is deployed from this monorepo and is not published to npm.
See the [site guide](apps/docs/README.md) for the full documentation workflow.

## Contribute

Read the root [AGENTS.md](AGENTS.md) and the relevant package's `AGENTS.md`
for development conventions and required checks.

For consumer-facing package changes, add a release declaration under `.changeset/`:

```bash
pnpm changeset
```

Packages are released independently through the root GitHub Actions Changesets workflow.
See [ARCHITECTURE.md](ARCHITECTURE.md) for release automation and dependency-aware CI.

## Repository guide

| Location | Contents |
| --- | --- |
| `packages/` | Publishable libraries and their source documentation |
| `apps/docs/` | Official English and Korean documentation site |
| `.changeset/` | Package release declarations and configuration |
| `.github/workflows/` | CI and release automation |
| [DECISIONS/](DECISIONS/) | Architecture decision records |

- [PACKAGES.md](PACKAGES.md): package scope, use cases, and comparable libraries.
- [ARCHITECTURE.md](ARCHITECTURE.md): dependency relationships, design decisions, and automation.
- [COMMANDS.md](COMMANDS.md): repository-specific OpenCode commands and skills.

# ilokesto Architecture

This document describes how ilokesto packages relate to each other and the decisions behind that structure.

## Dependency graph

```
                    @ilokesto/store
                          |
        +-----------------+-----------------+
        |                 |                 |
@ilokesto/state    @ilokesto/overlay    @ilokesto/form
                          |
              +-----------+
              |
      @ilokesto/modal     @ilokesto/toast
```

### Leaves (no internal dependencies)

- `@ilokesto/store`
- `@ilokesto/fetcher`
- `@ilokesto/utilinent`
- `@ilokesto/queryable` (private `0.0.1` beta; not in the release order or public docs)

### First-order consumers

- `@ilokesto/state` → `store`
- `@ilokesto/overlay` → `store`
- `@ilokesto/form` → `store`

### Second-order consumers

- `@ilokesto/modal` → `overlay` → `store`
- `@ilokesto/toast` → `overlay` + `store`

## Key architectural decisions

### 1. One repository, independent package versions

All package source lives under `packages/` in one pnpm workspace. Changesets versions and publishes packages independently, so cross-package changes can be reviewed and tested atomically without forcing lockstep releases.

### 2. `store` is the only shared foundation

`store` is intentionally small and framework-agnostic. Higher-level packages build on it rather than duplicating state primitives.

The next major foundation exports `ReadableStore`/`StoreApi` structural contracts
and `createStore`. Commits stay immediate; notifications drain synchronously in FIFO
order using captured commit values. Subscription ownership and delivery failures
are defined in `DECISIONS/005-state-foundation.md`.

### 3. `overlay` is the shared React layer

Both `modal` and `toast` are built on `overlay`. This keeps lifecycle, provider scoping, and adapter behavior consistent across layered UI components.

Each `ModalProvider` also owns an internal modal stack runtime. Inline and top-layer adapters share that provider-local runtime for topness, stack indexes, Escape, backdrop, and focus policy while `overlay` continues to own presence lifecycle and the item store. Multiple modal providers are isolated when they receive distinct overlay stores.

The `modal` / `globalModalStore` facade is the backward-compatible exception: providers without an explicit `store` all use the same global store, so applications must mount only one default `ModalProvider`. Applications that need multiple providers must pass a distinct store to each provider.

### 4. Framework adapters live in consumer packages

`state`, `form`, and future packages provide React/Vue/Solid/Svelte/Angular adapters in their own package directories. The core stays framework-agnostic.

State's root now owns vanilla construction and composition. Framework `bind(store)`
and `bindReducer(handle)` connect existing state without recreating it or
re-registering reducers. Existing `create` helpers use this same foundation.

### 5. Docs live with source

Each package owns its `docs/` folder. The private `apps/docs` Next.js/Fumadocs workspace consumes these originals, keeping code, content, and site changes in one review. English and Korean public URL paths remain unchanged. See `DECISIONS/004-docs-in-monorepo.md` for the production transition.

## Cross-cutting automation

- **Release**: Root Changesets versioning and the gated release job in `.github/workflows/ci.yml` create release PRs and publish packages after verification. `fetcher` publishes on `beta`; stable packages publish on `latest`.
- **Documentation**: Root build, typecheck, and tests include `apps/docs`. Vercel builds this workspace directly with package-owned documentation; cross-repository sync workflows are retired.
- **CI**: Root CI installs one lockfile, builds in dependency order, and preserves package-specific quality gates.

### Dependency-aware PR verification

The `Verify` workflow keeps `verify` as its final required check. Its `plan` job
reads workspace manifests and the PR's merge-base-to-head diff. Package changes
select the owning workspace and its transitive workspace consumers. Nested
example workspaces are matched before their parent package.

| Changed package | Library checks | Additional consumers |
| --- | --- | --- |
| `modal` | `modal` | docs |
| `toast` | `toast` | docs |
| `overlay` | `overlay`, `modal`, `toast` | docs |
| `form` | `form` | form examples and docs |
| `store` | `store`, `state`, `form`, `overlay`, `modal`, `toast` | form examples and docs |

Each selected job builds the package and its dependencies with the pnpm `...`
selector, but runs tests and typechecking only for the selected package. Building
`overlay` as a prerequisite of `modal` does not select overlay tests. The docs app
is a real workspace consumer: its builds may still require all library builds,
but they do not run those libraries' tests.

Specialized checks remain attached to their package: modal includes Chromium,
E2E, accessibility and package verification; form includes packed-consumer checks;
state includes test typechecking; fetcher includes distribution checks.

Package documentation-only changes select docs consumers. Changeset Markdown
and known root prose can produce an empty package selection, but ordinary PRs
still validate Changesets and must pass the final gate. Manifest, lockfile,
workspace configuration, CI, shared tooling and unclassified changes fall back
to the original full verification path. Release PRs and guarded release-head
dispatches always use that full path; the exact-SHA validation remains mandatory
before checkout.

The final gate always runs. Planning must succeed, the selected execution path
must succeed, and the unselected path must be skipped. Failure, cancellation,
missing outputs and unexpected skips cannot yield a successful `verify`.

Selection lives in `scripts/ci-plan.mjs`; selection and workflow gate behavior
are tested under `tests/monorepo/ci-*.test.mjs`. Runtime package changes need no
hardcoded CI dependency list. Workspace installation remains frozen and shared;
this design scopes verification, not dependency installation.

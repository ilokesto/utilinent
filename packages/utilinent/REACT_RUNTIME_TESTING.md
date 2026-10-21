# React runtime development checks

Run from the repository root with the repository's pnpm 10.17.1 and Node.js
22.13+ on the 22.x line, or Node.js 24+ (CI uses Node.js 22):

```sh
pnpm install --frozen-lockfile
pnpm --filter @ilokesto/utilinent test
pnpm --filter @ilokesto/utilinent test:react18
pnpm --filter @ilokesto/utilinent typecheck
pnpm --filter @ilokesto/utilinent build
pnpm test:monorepo
```

`test` keeps the normal React/ReactDOM 19.2.8 workspace runtime.
`test:react18` runs an explicit compatibility project against React and ReactDOM
18.3.1. It reuses suites whose contracts apply to both runtimes and adds a focused
React 18 compatibility spec for the mixed-version ref/component suites. It does
not claim to run the full React 19 suite. The existing React 18 and React 19
declaration checks still run through `typecheck`.

## Isolation and reproducibility

`scripts/test-react18.mjs` creates a unique temporary directory for each run,
copies the current `src` and `test` trees into it, and installs the private
`test/react18` manifest with its own `pnpm-lock.yaml` using
`pnpm install --frozen-lockfile`. The fixture pins React, ReactDOM, Testing
Library, Vitest, Vite, and jsdom. Its own workspace boundary prevents accidental
participation in the root workspace. It is not a published package.

The runner never swaps workspace modules, changes production peers, rewrites the
root lockfile, or links source files back into the workspace. Even externalized
Testing Library and ReactDOM CommonJS imports resolve inside the private install.
Parallel runs use separate source snapshots and module trees; pnpm may reuse its
ordinary content-addressed download store. Temporary files are removed after
success or a failed install/test command.

`test/Runtime.test.tsx` renders and updates a stateful component, asserts the
executing React and ReactDOM versions, and resolves dependencies from Testing
Library's and the renderer's own module contexts. It checks that both contexts
resolve the same React installation as the test and prints all four observed
versions. A renamed script or an alias that leaves a React 19 renderer behind
cannot satisfy these checks.

To deliberately update fixture dependencies, edit `test/react18/package.json`,
then run `pnpm --dir packages/utilinent/test/react18 install --lockfile-only`
and inspect the private lockfile diff. Normal runs never regenerate a lockfile.

## Supported-version differences

React 18.3.1 calls detached callback refs with `null`; it does not execute
functions returned by callback refs. An initial unfiltered diagnostic run with
React 18 passed 204 tests and failed exactly seven returned-cleanup assertions.
That diagnostic was a failed run, not a passing React 18 suite. The same 211
tests all passed with React 19.2.8. These seven contracts require React 19:

| File | React 19-only assertions |
| --- | --- |
| `Refs.test.tsx` | Slot returned cleanup; Observer returned cleanup; every cleanup from composed Slot callback refs |
| `Slot.test.tsx` | Stable Slot returned cleanup; object ref composed with a returned cleanup; stable Slottable returned cleanup |
| `LoadMore.test.tsx` | Returned external callback-ref cleanup and observer release |

All original test files, names, and assertions remain unchanged and mandatory in
the normal React 19 suite. The React 18 config explicitly lists its own files:
22 reusable suites plus `react18-compatibility.spec.tsx`. It does not load the
three mixed-version files, filter individual test names, mark tests skipped,
accept failures as success, or polyfill returned-ref cleanup.

The compatibility spec checks Slot, Observer, and LoadMore ordinary callback
refs (stable attachment, replacement, null detachment) and object refs
(attachment, stable rerender, unmount clearing). It also covers Slot presentation
and event merging, invalid/multiple children, Slottable siblings and host
replacement, child-ref ownership, Observer viewport transitions after ref
replacement, and LoadMore measurable sentinels, StrictMode request ownership,
ref replacement, registered targets, retry, and server rendering. Intersection
events are delivered by the existing controlled observer; there are no sleeps.

This is version-appropriate public behavior coverage, not one-for-one execution
of the mixed files. In particular, object refs composed with a *returned cleanup*
remain a React 19 fixture; plain composed callback/object refs are checked in
`Runtime.test.tsx` on both runtimes.

Error-boundary tests can print their intentionally thrown `boom` errors. These
diagnostics are not suppressed; any failing compatibility test exits nonzero.

## Exact suite inventory

Verified baseline: React 18.3.1 runs 23 files / 205 tests, all passing with no
skips (185 tests in the 22 reused files plus 20 focused compatibility tests).
React 19.2.8 runs 25 files / 211 tests, all passing with no skips. These totals
describe this revision; the projects intentionally have different inventories.

Paths below are relative to `test/`. React 19 discovers `**/*.test.tsx`; React 18
uses the explicit `include` list in `test/react18/vitest.config.ts`. When adding
a shared suite, add it to that list deliberately.

| File | React 18 | React 19 |
| --- | --- | --- |
| `core-fixes.test.tsx` | Yes | Yes |
| `DelayedFallback.test.tsx` | Yes | Yes |
| `intersectionObserverPool.test.tsx` | Yes | Yes |
| `Mount.test.tsx` | Yes | Yes |
| `new-components.test.tsx` | Yes | Yes |
| `new-hooks.test.tsx` | Yes | Yes |
| `observerGeneration.test.tsx` | Yes | Yes |
| `observerSubscription.test.tsx` | Yes | Yes |
| `proxy-lazy-tags.module.test.tsx` | Yes | Yes |
| `proxy-lazy-tags.test.tsx` | Yes | Yes |
| `proxy-plugins.test.tsx` | Yes | Yes |
| `Runtime.test.tsx` | Yes | Yes |
| `Show.test.tsx` | Yes | Yes |
| `Slacker.test.tsx` | Yes | Yes |
| `useEventListener.test.tsx` | Yes | Yes |
| `useFocusWithin.ssr.test.tsx` | Yes | Yes |
| `useFocusWithin.test.tsx` | Yes | Yes |
| `useInfiniteSentinel.test.tsx` | Yes | Yes |
| `useIntersectionObserver.test.tsx` | Yes | Yes |
| `useMediaQuery.test.tsx` | Yes | Yes |
| `usePageVisibility.test.tsx` | Yes | Yes |
| `usePendingDelay.test.tsx` | Yes | Yes |
| `LoadMore.test.tsx` | No | Yes |
| `Refs.test.tsx` | No | Yes |
| `Slot.test.tsx` | No | Yes |
| `react18-compatibility.spec.tsx` | Yes | No |

## CI

Both `full` and selected `packages` verification run `test:react18` after normal
unit tests. The selected step runs only for `@ilokesto/utilinent`, has no soft-fail
setting, and remains covered by the existing required `verify` aggregation.
`tests/monorepo/ci-utilinent-react18.test.mjs` parses the workflow and private
fixture metadata to protect this wiring without modifying the shared CI tests.

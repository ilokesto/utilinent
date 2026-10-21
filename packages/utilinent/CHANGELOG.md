# @ilokesto/utilinent

## 1.3.0

### Minor Changes

- f3fb118: Add `useInfiniteSentinel` and proxy-polymorphic `LoadMore` for controlled repeated page loading, with in-flight protection, explicit retry after failure, and measurable sentinel defaults.
- e688025: Add `usePageVisibility` to `@ilokesto/utilinent/hooks` to report document visibility with matching server and first hydration snapshots, stable subscriptions, and lifecycle cleanup.
- fb6f46a: Pass an AbortSignal to `Mount` factories and `Slacker` loaders. Each attempt owns a fresh controller: replacing `children`/`loader`, unmounting, and superseding a failed retry abort the previous signal, while zero-argument functions keep working unchanged and the existing stale-result guards stay in place. AbortErrors from already-aborted attempts are dropped silently (no `onError`, no retry, no console noise); AbortErrors surfacing from the live attempt remain ordinary failures.

  Document the function-identity restart contract with stable `useCallback` examples for `Mount` and `Slacker` in English and Korean, including the `onError` restart behavior. Add large-list lifespan guidance distinguishing lazy loading from virtualization or cache eviction, with a pagination example that bounds actually mounted rows without introducing a virtualization engine.

- a1070e2: Add `useFocusWithin` to `@ilokesto/utilinent/hooks` with a stable callback ref and focus-within boolean, internal focus movement handling, target lifecycle cleanup, and hydration-safe initial state.
- ae321b4: Add `isError` to `useInfiniteSentinel` results and `LoadMore` render state so every failure, including rejection with `undefined`, `null`, an empty string, `false`, or `0`, can be distinguished from success. Preserve the original `unknown` error reason and clear failure state only when an eligible new attempt starts.
- 9548a14: Add `usePendingDelay` and the polymorphic `DelayedFallback` component to prevent
  brief loading flashes with a reveal delay and minimum visible duration. Preserve
  continuous visibility across restarted requests, recalculate changed timing
  options from phase start times, and clean up timers on unmount.

### Patch Changes

- fb6f46a: Fix `useMediaQuery` hydration: the first client render now uses the same `false` snapshot as the server and synchronizes to the actual media match in a layout effect before the first paint, removing recoverable hydration errors when server and client media states differ. Query replacement and change-listener cleanup behavior are unchanged, and `Media` documents the matching SSR contract.

  Fix `useEventListener` ref target tracking: listeners now follow the DOM node a `RefObject` points to when the node mounts later, is swapped to a different node, or the ref is cleared to `null`, detaching from the previous node. Handler-only updates keep the no-rebind contract and `disabled`/`capture`/`passive` changes keep re-binding with cleanup.

- fb6f46a: Stabilize `useIntersectionObserver` and `Observer` subscriptions.

  - Normalize thresholds by value set, so a fresh-but-equal inline `threshold` array no longer recreates the native observer on every record; reordered and duplicated values are equivalent, and only real value changes replace the observation.
  - Share one native `IntersectionObserver` between subscriptions with the same root identity, `rootMargin`, and normalized thresholds. Records route per target, freezing or unsubscribing one target stops only that target, and the final unsubscribe disconnects the shared observer and clears its registry entry.
  - Scope `freezeOnceVisible` to the observed target: removing, swapping, or reattaching the target resets the frozen state and re-observes from scratch, and turning the option off resumes observation instead of leaving the hook permanently unobserved.
  - Subscribe `Observer` to the intersection boolean only, so same-boolean records no longer re-render it. `useIntersectionObserver` keeps updating `entry` on every record for ratio/coordinate consumers, and the documented render-prop children form now typechecks.

- fb6f46a: Create HTML tag wrappers for polymorphic proxies on first access instead of pre-allocating a wrapper for every known tag at proxy creation, so importing the package no longer creates 425 tag wrappers (85 tags × 5 polymorphic proxies) at module evaluation.

  Reflection keeps reporting tags as own properties: `in` checks succeed without allocating, `Object.keys` and `for...in` still list every tag, and `Object.getOwnPropertyDescriptor` materializes the wrapper so its value matches property access. Repeated reads of the same tag return the cached wrapper identity, and tag-over-plugin priority plus cached-plugin lifetime are unchanged.

- fb6f46a: Clarify the Slot children contract: development-mode warnings for multiple children and non-element children, and preserve Slottable siblings when the slotted child is invalid instead of rendering nothing.

  Keep Slot's composed ref referentially stable while the forwarded ref and the child ref keep their identity, avoiding redundant ref detach/attach cycles and cleanup re-runs on rerenders across both the plain Slot and Slottable paths.

## 1.2.1

### Patch Changes

- 99ef2f0: Keep `useKey` subscriptions stable when only the handler changes.
- e4d94f5: Share plugin rendering and caching after category selection while preserving tag precedence, base fallback, and lazy per-proxy resolution.

## 1.2.0

### Minor Changes

- 36fc983: Add browser-observation hooks (behind a `./hooks` subpath), companion components, and API cleanups. The main `.` entry is now components-only; hooks are imported from `@ilokesto/utilinent/hooks`.

  > Migration: update hook imports `from '@ilokesto/utilinent'` to `from '@ilokesto/utilinent/hooks'`. Component imports from `@ilokesto/utilinent` are unchanged.

  New hooks (subpath `./hooks`):

  - `useEventListener` — attach DOM listeners to a window/document/element target or ref.
  - `useResizeObserver` — track element size; returns `ref`, `width`, `height`.
  - `useMediaQuery` — subscribe to a CSS media query (SSR-safe).
  - `useClickAway` — invoke a handler on outside pointer/touch events.
  - `useHover` / `useHoverRef` — track hover state.
  - `useKey` — invoke a handler on a key press (`KeyboardEvent.code` or `"*"`).
  - `useDebounce` / `useThrottle` — debounce/throttle a value.
  - `useIsomorphicLayoutEffect` — now exported publicly (subpath `./hooks`).

  New components (main `.`):

  - `Measure` — `ResizeObserver`-driven size render prop.
  - `Media` — render children based on a media query match.
  - `ClickAway` — outside-click wrapper.
  - `Hoverable` — hover render prop.
  - `Hotkey` — declarative keyboard hotkey.
  - `ErrorBoundary` — catch render errors with a `fallback` (pairs with `Mount`).
  - `ClientOnly` — render children only after client mount (SSR-safe).

  API cleanups (non-breaking unless noted):

  - `useIntersectionObserver` option `onChange` renamed to `onIntersect` to match `Observer`; `onChange` kept as a deprecated alias.
  - `OptionalWrapper` adds `elseWrapper`; `fallback` kept as a deprecated alias.
  - `Observer` adds `keepMeasurable` (opt-in 1x1 measurable box) and defaults `rootMargin` to `"0%"` to match the hook.
  - Removed the duplicate `Slot/composeRefs.ts` re-export.
  - Fixed a malformed `Switch` JSDoc example.
  - Updated `AGENTS.md` / skill to reflect existing tests.

### Patch Changes

- 53d16e2: Correct documentation frontmatter, MDX comments, and table syntax so package-owned content builds in the official monorepo documentation application.
- bb26d48: Point package repository links to the ilokesto organization monorepo and update the fetcher homepage before retiring the legacy repositories.
- c850635: Introduce Changesets for automated versioning and changelog management
- 95b7cec: Process initially visible IntersectionObserver records so Slacker loads on mount and triggerOnce observers disconnect immediately.
- 44c3b1a: Reject direct Promise-like Mount children with React 19 types while preserving factory-only asynchronous children.
- 33069c5: Propagate React 19 callback-ref cleanup functions through Slot and Observer while preserving composed object refs.
- 8d60e03: Reduce code duplication and improve maintainability across the package. Extract a shared `createTagRenderer` factory that eliminates the per-component `forwardRef` + `createElement` boilerplate duplicated in Show, For, Repeat, Mount, and Switch. Extract `useIsomorphicLayoutEffect`, `isPromiseLike`, and `composeRefs` into shared `hooks/` and `utils/` modules, removing cross-component imports. Unify `RegistryCategory` as the single source of truth for plugin categories so `PluginManager` no longer maintains a separate literal list. Remove unused types (`ExtractValues`, `ExtractByKeyValue`, `GetLiteralKeys`, `LiteralKeys`), dead `SwitchTagHelper` type, and a non-functional generic on `For`'s `renderForTag`. No public API changes.
- 7097e70: Move Slacker loading and retries out of render with deterministic shared retry ownership and stale-work cancellation.

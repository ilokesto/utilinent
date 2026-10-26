# Native browser regressions

From a clean standalone checkout with Node.js 24.22.1 and pnpm 10.17.1:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test:browser
```

`test:browser` first typechecks the isolated harness, then runs Playwright once
with zero retries. It uses the existing React 19 runtime and bundled Chromium
in desktop (1280 x 800) and mobile-width (390 x 844) viewports. The latter is a
viewport regression, not a claim about a physical mobile browser.

The Vite worker fixture renders the actual source with React `renderToString`.
The client hydrates the same component tree only when the test triggers it, so
server output can be asserted before hydration. Recoverable hydration errors,
browser errors, and console errors fail the tests. A deliberately corrupted
server snapshot proves the hydration detector itself detects a real mismatch.

The suite covers:

- Native scrolling through a constrained root, controlled busy-to-idle rearming,
  duplicate prevention while busy, failed work, explicit retry, and `hasMore`
  termination even after leaving and reentering the viewport.
- Native Tab and Shift+Tab, including internal child moves without false focus
  transitions, plus focus-listener teardown.
- Native document visibility through activation of two actual Chromium pages.
  CDP attachment uses `noDefaults: true` so focus emulation is not enabled;
  `visibilityState` is never
  overridden and `visibilitychange` is never dispatched by the harness.
- Delayed pending UI with Playwright's clock: early cancellation, exact reveal
  and minimum-hold boundaries, and timer cancellation on unmount.
- Observer/listener removal and late consumer-promise rejection after unmount.

Signals are subscribed before actions and bounded by failure-only Node timers.
There are no fixed sleeps, `waitForTimeout`, or timing-based polling assertions.
Instrumentation forwards native listener, observer, and timer operations; it
does not manufacture geometry, focus, or visibility events.

Each worker binds its own loopback port 0 and owns a temporary Vite cache. Each
test launches the installed stock Chromium executable with a private profile and
debugging port 0, then attaches through Playwright's public CDP API. The locked
Playwright version supports `noDefaults`; ordinary Playwright launches force
visibility through focus emulation, which a second CDP session cannot undo.
Nested `finally` blocks close the browser,
server, Vite resources, and temporary directories even when setup or assertions
fail. Cleanup receipts appear in terminal output. Event JSON and screenshots
are attached under ignored `browser-results/`; no existing local server or
personal browser profile is reused.

There is no automatic installed-Chrome fallback. CI installs and uses stock
Chromium in both full verification and selected utilinent verification;
failures feed the existing required `verify` aggregation.

Related checks:

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm test:react18
```

The harness stays outside the unit-test and distribution source globs. No
runtime API, private helper, or existing test is changed for these regressions.

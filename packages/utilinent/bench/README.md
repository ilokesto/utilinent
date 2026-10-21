# utilinent measurements

English | [한국어](./README.ko.md)

This standalone development tool measures the current source, not an older
implementation. It does not import the browser regression suite. Nothing under
`bench/` ships in the npm package, and no runtime source instrumentation is added.

## Reproduce

From the repository root, with the Node version supported by the workspace and
the pnpm version in the root manifest:

```sh
pnpm install --frozen-lockfile
pnpm --filter @ilokesto/utilinent exec playwright install chromium
pnpm --filter @ilokesto/utilinent bench --warmup 3 --samples 5 --targets 100 --iterations 20 --output /tmp/utilinent-run-1.json
pnpm --filter @ilokesto/utilinent bench --warmup 3 --samples 5 --targets 100 --iterations 20 --output /tmp/utilinent-run-2.json
```

On Linux, Playwright may need `playwright install --with-deps chromium`. Each
command launches a fresh headless Chromium process and context, builds a
production React bundle in memory using the package's Vite, and serves it on an
OS-assigned loopback port. The browser and server close before JSON is emitted.
There is no persistent browser profile or build directory. Browser installation
is Playwright's normal reusable cache, not an artifact created by the benchmark.

The four numeric options are safe integers; warmup can be zero, the others must
be positive. Defaults are the values above. One warmup is a full lazy, observer,
and mount workload, discarded from the result. Each sample repeats those same
three workloads. `iterations` is the proxy count in the lazy workload and the
number of fresh React roots in the mount workload. `targets` is the observed
target count per root and the cached reads per proxy. GC runs after timing, not
inside measured loops. `--output` writes JSON without pnpm's console banners;
the CLI also emits JSON on stdout. Use `node bench/run.mjs` from the package
directory if stdout must contain only JSON.

## What is measured

| Workload | Observation | Deterministic invariant |
| --- | --- | --- |
| Lazy tags | Proxy creation, first access, cached access milliseconds; actual factory-returned wrapper count | Zero wrappers before access; one `div` wrapper per proxy; repeated reads preserve identity; separate proxies do not share wrappers |
| Shared observer | Subscription/release milliseconds, native callback wait, constructor/observe/unobserve/disconnect counts | Equal normalized options share one native observer; the last owner alone disconnects it; all targets receive a real native entry |
| React mount/unmount | Production `createRoot`, `Show.div`, and `useIntersectionObserver` mounted into real DOM; mount/unmount milliseconds and target lifecycles/second | All targets mount, subscribe, unmount, and unsubscribe; one native observer per root lifetime; pool returns to zero |
| Cleanup retention | WeakRef survivor counts for targets, callback payload objects, explicit roots, native observers, and positive controls after forced GC | The known strong-reference control must be detected; collection of released objects is an observation, not a timing-dependent assertion |

Lazy measurement uses the existing internal `createProxy` and `createTagRenderer`
with a counted factory returning real React wrappers. It also checks `Show.div`
identity. This is not a count of all JavaScript allocations, an import-time
allocation profile of every exported component, or a byte measurement.

The browser subclasses its original native `IntersectionObserver` only to count
constructor and method calls and signal subscription readiness. Every method and
callback delegates to Chromium; this is not a fake observer. The instrumentation
owns only numeric counters and optional WeakRefs, never a strong list of
observers or targets. Counts describe native API calls, not private browser heap
objects. Pool counters are a separate internal ownership check.

Observer targets alternate equivalent thresholds `[0.5, 0]` and `[0, 0.5, 0.5]`
with the same viewport root and `"0px"` margin. Native delivery completes through
the real callback signal, with a 30-second failure timeout, not a sleep. Callback
waiting is reported separately and is not a measure of pure native computation.
Partial release leaves exactly one subscription before final disposal.

The React workload uses production React without StrictMode. Each iteration
creates a fresh root and target components, synchronously renders using
`flushSync`, awaits the exact native `observe` count (including ref-driven React
updates and passive subscription effects), and synchronously unmounts. It does
not wait for intersection delivery or paint. Mount/unmount timing includes React
and instrumentation overhead; total elapsed time also includes fixture setup,
assertions, and teardown. Throughput is **target mount-plus-unmount lifecycles per
second**, not rendered frames or independent root operations per second. This
does not benchmark the separate asynchronous `Mount` component.

## Retention method and limits

After timed samples, a separate native-observer cohort creates an explicit DOM
root, `targets` elements, and one payload object per callback that itself owns
its target. The tool records only WeakRefs, waits for native delivery, releases
every subscription, removes the fixture root, and returns from the setup function
so release closures and local arrays are no longer held. It never deletes React
fields, edits DOM internals, or manually nulls library-owned references.

In parallel, the harness deliberately retains a second cohort of detached
elements via payload objects. Chromium CDP `HeapProfiler.collectGarbage` is
invoked twice from the driver, outside the browser task that created or
dereferenced the WeakRefs. `controlRetained` counts survivors with this strong
reference still present. The tool then releases only its control array, forces
two more collections, and records `controlReleased`. This demonstrates that the
measurement can detect known retained references and observes what happens when
they are released. The control does not pretend to be a library leak.

Zero survivors in the released cohort shows collection in that run; it is not a
proof against every possible leak. Nonzero survivors are reported, not hidden,
retried until green, or treated as automatic leaks. This cohort isolates direct
pool target/callback/root/observer ownership; it does **not** measure React fiber,
application closure, or every browser-internal object's retention after unmount.
Mount ownership is checked separately through DOM removal, native calls, and pool
subscription counts. The cached wrappers deliberately remain owned by their
proxies while those proxies are live.

Forced GC is supported by the selected Chromium/CDP environment. Unsupported
browser/CDP execution fails visibly instead of inventing GC results.
`heapBytes.value` is `null`: no trustworthy attributable byte baseline is
available. Whole-page heap sizes would mix React, JIT, the benchmark, DOM, and
native observer bookkeeping. There is no before/after optimization baseline,
allocation-byte saving, or claimed speedup.

## JSON contract and validation

`schemaVersion: 1` contains:

- `environment`: timestamp, Git source revision, package/Node/React/ReactDOM/Vite/
  Playwright/Chromium versions, OS, architecture, CPU, viewport, and user agent.
- `config`: warmup, sample, target, and iteration counts.
- `measurements.samples[]`: raw `lazy`, `observer`, and `mount` results, with
  explicit `Ms` timing units. No samples are discarded as outliers.
- `invariants`: final pool/DOM ownership, restoration of the original native
  observer, lifecycle checks, and retained-control detection.
- `retention`: GC method, collections per checkpoint, and survivor counts.
- `heapBytes`: unavailable value and reason; `limits`: interpretation limits.
- `resources`: successful browser/server closure and in-memory build status.

Invariant or browser errors produce a nonzero exit; timing, throughput, and
released-cohort survivor counts have no pass thresholds. The benchmark is an
explicit command, not a speed gate in ordinary CI.

Run existing package checks independently:

```sh
pnpm --filter @ilokesto/utilinent test
pnpm --filter @ilokesto/utilinent typecheck
pnpm --filter @ilokesto/utilinent build
```

The implementation and documentation were AI-assisted. The accompanying measured
results distinguish actual executions from unmeasured bytes and comparisons.

## Recorded executions: October 21, 2026

Full, unfiltered sample values: [run 1](./results/2026-10-21-run-1.json) and
[run 2](./results/2026-10-21-run-2.json). They are independent CLI/browser runs
started at `05:04:50.254Z` and `05:04:51.164Z`, sequentially with the command
above, after package checks finished. Both exited 0. Each used 3 discarded
warmups, 5 samples, 100 targets, and 20 iterations: 2,000 target lifecycles per
mount sample. No CPU isolation or controlled background-load guarantee was used.

Environment: Apple M4 Pro, 12 logical CPUs, arm64 Darwin 27.2.0, Node 24.20.0,
pnpm 10.17.1, utilinent 1.2.1 at source revision
`e688025ded18bc78eaeb757341c7622a3a15ff40`, React/ReactDOM 19.2.8, Vite 7.3.6,
Playwright 1.62.1, Chromium 151.0.7922.34, headless 1280 x 720.
The benchmark itself was an uncommitted addition to that source revision.

The table reports the median of five samples; ranges retain every sample.

| Observation | Run 1 | Run 2 |
| --- | --- | --- |
| Mount time per 2,000 targets | 6.3 ms (5.5–6.4) | 6.1 ms (5.3–6.3) |
| Unmount time per 2,000 targets | 1.0 ms (0.9–1.7) | 1.4 ms (0.9–1.6) |
| Full mount/unmount batch elapsed | 7.3 ms (6.9–7.5) | 7.3 ms (6.9–7.7) |
| Target lifecycles/second | 273,973 (266,667–289,855) | 273,973 (259,740–289,855) |
| Native entry delivery wait | 6.6 ms (2.8–15.1) | 9.0 ms (8.9–10.6) |

Lazy construction/first/cached access and observer subscribe/release batches
were near the observed timer granularity. A reported zero does not
mean no work or zero cost; these small batches cannot resolve useful speed
differences. Increase counts for further investigation, not to manufacture a
favorable comparison. Native delivery waiting includes scheduling.

All ten samples observed zero wrappers before tag access, 20 after first access,
and still 20 after 2,000 cached reads, with stable identity. Each 100-target
observer sample constructed one real native observer, called observe/unobserve
100 times each, delivered 100 target entries, and disconnected once at the last
release. Each mount sample constructed/disconnected 20 observers and
observed/unobserved 2,000 targets; zero intersection callbacks arrived during
those mount batches. Final pool subscriptions/observers and fixture containers
were zero in both runs.

At the first GC checkpoint, both runs observed 0/100 released targets, 0/100
payloads, 0/1 roots, and 0/1 native observers still live, while **100/100 control
targets and 100/100 control payloads remained live**. After releasing the control
and collecting again, both control counts were zero. Browser/server closure and
native observer restoration succeeded. Byte retention remains unmeasured.

Package verification passed: 24 Vitest files / 209 tests, package typecheck
(including React 19 contracts), and build. All three benchmark scripts passed syntax
checks and language-server diagnostics. An invalid `--targets 0` was rejected.
The initial smoke run exposed a Vite output-array handling bug, corrected before
the successful smoke and the two recorded runs. No failing samples from either
recorded run were removed.

The parent split the self-contained lazy-allocation workload into `lazy.js` to
keep modules small, then repeated both full runs. Published JSON and the table
above are from those final executions.

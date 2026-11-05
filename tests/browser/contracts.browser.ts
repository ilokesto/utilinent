import { test, expect } from "../fixtures/browser/fixtures";

function loadState(calls: number, loading: boolean, intersecting = true, error: string | null = null) {
  return (value: unknown) => JSON.stringify(value) === JSON.stringify({ calls, loading, intersecting, error });
}

test("useHover/useHoverRef: native mouse with target replacement and detach -> resets state and releases listeners", async ({ app }) => {
  const state = (target: string | null, hovering: boolean, revision = 0) =>
    (value: unknown) => JSON.stringify(value) === JSON.stringify({ target, hovering, refHovering: hovering, stable: true, revision });
  await app.open("/hover");
  await app.hydrate("hover-state", state("a", false));
  await app.page.locator("#hover-replace").focus();
  await app.until("hover-state", state("a", true), () => app.page.locator("#hover-a").hover());

  await app.until("hover-state", state("b", false), () => app.page.keyboard.press("Enter"));

  expect(await app.page.evaluate(() => window.harness.resources().listeners)).toBe(4);
  await app.page.locator("#hover-same").focus();
  await app.until("hover-state", state("b", true), () => app.page.locator("#hover-b").hover());
  await app.until("hover-state", state("b", true, 1), () => app.page.keyboard.press("Enter"));
  expect(await app.page.evaluate(() => window.harness.resources().listeners)).toBe(4);
  await app.until("hover-state", state("b", false, 1), () => app.page.mouse.move(0, 0));
  await app.until("hover-state", state("b", true, 1), () => app.page.locator("#hover-b").hover());
  await app.page.locator("#hover-toggle").focus();

  await app.until("hover-listeners", value => value === 0,
    () => app.until("hover-state", state(null, false, 1), () => app.page.keyboard.press("Enter")));

  expect(await app.page.evaluate(() => window.harness.resources().listeners)).toBe(0);
  await app.page.mouse.move(0, 0);
  await app.until("hover-listeners", value => value === 4,
    () => app.until("hover-state", state("b", false, 1), () => app.page.keyboard.press("Enter")));
  expect(await app.page.evaluate(() => window.harness.resources().listeners)).toBe(4);
  await app.until("hover-state", state("b", true, 1), () => app.page.locator("#hover-b").hover());
  await app.unmount();
});

test("useDebounce/useThrottle: callable value updates -> preserve identity, time boundaries and unmount cleanup", async ({ app }) => {
  const state = (input: string, debounced: string, throttled: string) =>
    (value: unknown) => JSON.stringify(value) === JSON.stringify({ input, debounced, throttled });
  await app.page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await app.open("/callable-values");
  expect(await app.page.locator("#debounced-value").textContent()).toBe("initialValue");
  expect(await app.page.locator("#throttled-value").textContent()).toBe("initialValue");
  await app.hydrate("value-state", state("initialValue", "initialValue", "initialValue"));
  await app.page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
  await app.click("value-second", "value-state", state("secondValue", "initialValue", "secondValue"));
  await app.page.clock.runFor(50);

  await app.click("value-latest", "value-state", state("latestValue", "initialValue", "secondValue"));

  await app.page.clock.runFor(49);
  expect(await app.page.locator("#debounced-value").textContent()).toBe("initialValue");
  expect(await app.page.locator("#throttled-value").textContent()).toBe("secondValue");
  await app.until("value-state", state("latestValue", "initialValue", "latestValue"),
    () => app.page.clock.runFor(1));
  await app.until("value-state", state("latestValue", "latestValue", "latestValue"),
    () => app.page.clock.runFor(50));
  await app.click("value-second", "value-state", state("secondValue", "latestValue", "latestValue"));
  expect(await app.page.evaluate(() => window.harness.resources().timers)).toBe(2);
  await app.unmount();
  const count = app.signals.filter(signal => signal.kind === "value-state").length;
  await app.page.clock.runFor(200);
  expect(app.signals.filter(signal => signal.kind === "value-state")).toHaveLength(count);
});

test("OptionalWrapper: selected branches with throwing inactive wrappers -> preserves children, refs and native clicks", async ({ app }) => {
  const state = (condition: string, branch: string, clicks: number) =>
    (value: unknown) => JSON.stringify(value) === JSON.stringify({ condition, branch, clicks, ref: "optional-child" });
  await app.open("/optional");
  await app.hydrate("optional-state", state("empty", "else", 0));
  expect(await app.page.locator("#optional-else > #optional-child").count()).toBe(1);

  await app.click("optional-true", "optional-state", state("truthy", "else", 0));

  expect(await app.page.locator("#optional-wrapper > #optional-child").count()).toBe(1);
  await app.click("optional-child", "optional-state", state("truthy", "else", 1));
  await app.click("optional-mixed", "optional-state", state("mixed", "else", 1));
  expect(await app.page.locator("#optional-else > #optional-child").count()).toBe(1);
  await app.click("optional-use-fallback", "optional-state", state("mixed", "fallback", 1));
  expect(await app.page.locator("#optional-fallback > #optional-child").count()).toBe(1);
  await app.click("optional-plain", "optional-state", state("mixed", "plain", 1));
  expect(await app.page.locator("#optional-host > #optional-child").count()).toBe(1);
  await app.click("optional-child", "optional-state", state("mixed", "plain", 2));
  expect(await app.page.locator("#optional-child").textContent()).toContain("Child clicks: 2");
  await app.unmount();
});

test("ErrorBoundary: equal and changed reset keys -> retries only on value changes and recovers manually", async ({ app }) => {
  app.expectedCaughtErrors = Array(3).fill("Error: expected boundary failure");
  await app.open("/boundary");
  await app.hydrate("boundary-ready", value => value === true);
  await app.click("boundary-fail", "boundary-parent", value =>
    JSON.stringify(value) === JSON.stringify({ key: 1, extra: false, fails: true, ticks: 0 }));
  expect(await app.page.locator("#boundary-fallback").count()).toBe(1);

  await app.click("boundary-same", "boundary-parent", value =>
    JSON.stringify(value) === JSON.stringify({ key: 1, extra: false, fails: true, ticks: 1 }));

  expect(app.signals.filter(signal => signal.kind === "boundary-error")).toHaveLength(1);
  await app.click("boundary-value", "boundary-error", value => value === "expected boundary failure");
  expect(app.signals.filter(signal => signal.kind === "boundary-error")).toHaveLength(2);
  await app.click("boundary-length", "boundary-error", value => value === "expected boundary failure");
  expect(app.signals.filter(signal => signal.kind === "boundary-error")).toHaveLength(3);
  await app.click("boundary-repair", "boundary-parent", value =>
    JSON.stringify(value) === JSON.stringify({ key: 2, extra: true, fails: false, ticks: 1 }));
  expect(await app.page.locator("#boundary-fallback").count()).toBe(1);
  await app.click("boundary-retry", "boundary-ready", value => value === true);
  expect(await app.page.locator("#boundary-content").textContent()).toBe("Boundary content ready");
  expect(app.signals.filter(signal => signal.kind === "boundary-error")).toHaveLength(3);
  await app.unmount();
});

test("useIntersectionObserver: native visible target replacement -> resets snapshot and reports each first entry", async ({ app }) => {
  await app.open("/intersection");
  expect(await app.page.locator("#intersection-visible").textContent()).toBe("false");
  await app.hydrate("intersection-state", value =>
    JSON.stringify(value) === JSON.stringify({ which: "a", visible: true, entry: "target-a" }));
  expect(await app.page.evaluate(() => window.harness.resources().targets)).toBe(0);

  await app.click("replace-target", "intersection-state", value =>
    JSON.stringify(value) === JSON.stringify({ which: "b", visible: true, entry: "target-b" }));

  expect(app.signals.filter(signal => signal.kind === "intersection-enter").map(signal => signal.value))
    .toEqual(["target-a", "target-b"]);
  expect(app.signals.filter(signal => signal.kind === "intersection-state").map(signal => signal.value))
    .toContainEqual({ which: "b", visible: false, entry: null });
  expect(await app.page.locator("#intersection-visible").textContent()).toBe("true");
  expect(await app.page.locator("#intersection-entry").textContent()).toBe("target-b");
  expect(await app.page.evaluate(() => window.harness.resources().targets)).toBe(0);
  await app.unmount();
});

test("LoadMore: native scrolling and controlled busy cycles -> repeat, retry and stop at hasMore", async ({ app }) => {
  await app.open("/infinite");
  expect(await app.page.locator("#calls").textContent()).toBe("0");
  await app.hydrate("load-state", loadState(0, false, false));

  await app.scroll(true, loadState(1, true));
  await app.scroll(false, loadState(1, true, false));
  await app.scroll(true, loadState(1, true));
  await app.click("finish", "load-state", loadState(2, true));
  await app.click("fail", "load-state", loadState(2, false, true, "page failed"));

  expect(app.signals.filter(signal => signal.kind === "load-error")).toHaveLength(1);
  expect(await app.page.locator("#calls").textContent()).toBe("2");
  await app.click("retry", "load-state", loadState(3, true));
  await app.click("end", "load-state", loadState(3, false));
  await app.scroll(false, loadState(3, false, false));
  await app.scroll(true, loadState(3, false));
  expect(await app.page.locator("#error").textContent()).toBe("none");
  await app.unmount();
});

test("LoadMore: unmount during consumer work -> observer released and late rejection ignored", async ({ app }) => {
  await app.open("/infinite");
  await app.hydrate("load-state", loadState(0, false, false));
  await app.scroll(true, loadState(1, true));

  await app.unmount();
  await app.until("settled", value => value === true,
    () => app.page.evaluate(() => window.harness.settle(true)));

  expect(app.signals.filter(signal => signal.kind === "load-error")).toEqual([]);
});

test("useFocusWithin: native Tab and Shift+Tab -> internal moves never report false", async ({ app }) => {
  await app.open("/focus");
  expect(await app.page.locator("#focus").textContent()).toBe("false");
  await app.hydrate("focus", value => value === false);
  await app.until("native-focus", value => value === "before", () => app.page.locator("#before").focus());
  const start = app.signals.length;

  await app.until("focus", value => value === true, () => app.page.keyboard.press("Tab"));
  expect(await app.page.evaluate(() => document.activeElement?.id)).toBe("first");
  await app.until("native-focus", value => value === "second", () => app.page.keyboard.press("Tab"));
  await app.until("focus", value => value === false, () => app.page.keyboard.press("Tab"));
  expect(await app.page.evaluate(() => document.activeElement?.id)).toBe("after");
  await app.until("focus", value => value === true, () => app.page.keyboard.press("Shift+Tab"));
  await app.until("native-focus", value => value === "first", () => app.page.keyboard.press("Shift+Tab"));
  await app.until("focus", value => value === false, () => app.page.keyboard.press("Shift+Tab"));

  expect(await app.page.evaluate(() => document.activeElement?.id)).toBe("before");
  expect(app.signals.slice(start).filter(signal => signal.kind === "focus").map(signal => signal.value))
    .toEqual([true, false, true, false]);
  expect(await app.page.evaluate(() => window.harness.resources().listeners)).toBe(2);
  await app.unmount();
});

test("usePageVisibility: SSR and native page activation -> hydrate then follow hidden and visible", async ({ app }) => {
  await app.open("/visibility");
  expect(await app.page.locator("#visibility").textContent()).toBe("false");
  await app.page.bringToFront();
  await app.hydrate("visibility", value => value === true);
  expect(app.signals.filter(signal => signal.kind === "visibility").map(signal => signal.value)).toEqual([false, true]);
  expect(await app.page.evaluate(() => window.harness.resources().listeners)).toBe(1);
  const other = await app.page.context().newPage();
  try {
    // Creating a page may already activate it; restore the baseline before arming.
    if (await app.page.evaluate(() => document.visibilityState === "hidden")) {
      await app.until("visibility", value => value === true, () => app.page.bringToFront());
    }

    await app.until("visibility", value => value === false, () => other.bringToFront());
    expect(await app.page.evaluate(() => document.visibilityState)).toBe("hidden");
    await app.until("visibility", value => value === true, () => app.page.bringToFront());

    expect(await app.page.evaluate(() => document.visibilityState)).toBe("visible");
    await app.unmount();
    const count = app.signals.filter(signal => signal.kind === "visibility").length;
    let nativeHidden: Promise<void> | undefined;
    await app.until("native-hide-armed", value => value === true, async () => {
      nativeHidden = app.page.evaluate(() => new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { document.removeEventListener("visibilitychange", changed); reject(new Error("Missing native hide")); }, 5_000);
        function changed() {
          if (document.visibilityState === "hidden") {
            clearTimeout(timeout);
            document.removeEventListener("visibilitychange", changed);
            resolve();
          }
        }
        document.addEventListener("visibilitychange", changed);
        void window.reportSignal({ kind: "native-hide-armed", value: true });
      }));
    });
    await other.bringToFront();
    await nativeHidden;
    expect(app.signals.filter(signal => signal.kind === "visibility")).toHaveLength(count);
  } finally {
    await other.close();
  }
});

test("SSR hydration detector: corrupted server markup -> reports a real recoverable mismatch", async ({ app }) => {
  app.expectedHydrationErrors = 1;
  await app.open("/visibility");
  await app.page.locator("#visibility").evaluate(node => { node.textContent = "incorrect server snapshot"; });

  await app.hydrate("hydration-error", value => typeof value === "string" && /hydration|hydrated/i.test(value));

  await app.unmount();
});

test("DelayedFallback: clock-controlled pending -> suppress fast work and hold slow work", async ({ app }) => {
  await app.page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await app.open("/pending");
  expect(await app.page.locator("#content").textContent()).toBe("Results ready");
  await app.hydrate("pending", value => value === false);
  await app.page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
  await app.click("start", "pending", value => value === true);
  await app.page.clock.runFor(499);
  expect(await app.page.locator("#indicator").count()).toBe(0);
  await app.click("finish", "pending", value => value === false);
  await app.page.clock.runFor(1_000);
  expect(app.signals.filter(signal => signal.kind === "indicator")).toEqual([]);

  await app.click("start", "pending", value => value === true);
  await app.until("indicator", value => value === true, () => app.page.clock.runFor(500));
  await app.click("finish", "pending", value => value === false);
  await app.page.clock.runFor(599);
  expect(await app.page.locator("#indicator").count()).toBe(1);
  await app.until("indicator", value => value === false, () => app.page.clock.runFor(1));

  expect(await app.page.locator("#content").count()).toBe(1);
  await app.click("start", "pending", value => value === true);
  expect(await app.page.evaluate(() => window.harness.resources().timers)).toBe(1);
  await app.unmount();
  const count = app.signals.length;
  await app.page.clock.runFor(2_000);
  expect(app.signals).toHaveLength(count);
});

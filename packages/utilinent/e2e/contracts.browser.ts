import { test, expect } from "./fixtures";

function loadState(calls: number, loading: boolean, intersecting = true, error: string | null = null) {
  return (value: unknown) => JSON.stringify(value) === JSON.stringify({ calls, loading, intersecting, error });
}

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

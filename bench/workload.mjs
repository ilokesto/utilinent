import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Show } from "../src/components/Show";
import { lazySample } from "./lazy.mjs";
import {
  getIntersectionObserverPoolStatsForTests,
  subscribeIntersection,
} from "../src/hooks/intersectionObserverPool";
import { useIntersectionObserver } from "../src/hooks/useIntersectionObserver";

const NativeObserver = window.IntersectionObserver;
const counts = { constructed: 0, observe: 0, unobserve: 0, disconnect: 0, callbacks: 0 };
let onObserve;
let observerRefs;
let retentionRefs;
let retainedControl;

// This delegates every call to Chromium; it holds no strong target/observer list.
window.IntersectionObserver = class extends NativeObserver {
  constructor(callback, options) {
    super((entries, observer) => {
      counts.callbacks += 1;
      callback(entries, observer);
    }, options);
    counts.constructed += 1;
    observerRefs?.push(new WeakRef(this));
  }
  observe(target) {
    super.observe(target);
    counts.observe += 1;
    onObserve?.();
  }
  unobserve(target) {
    super.unobserve(target);
    counts.unobserve += 1;
  }
  disconnect() {
    super.disconnect();
    counts.disconnect += 1;
  }
};

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function emptyPool() {
  const stats = getIntersectionObserverPoolStatsForTests();
  check(stats.sharedObservers === 0 && stats.subscriptions === 0, "Pool still owns subscriptions");
  return stats;
}

function signal() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function bounded(promise) {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Native lifecycle signal did not arrive within 30 seconds")), 30_000);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

function delta(before) {
  return Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, count - before[key]]));
}

async function observerSample(targetCount) {
  emptyPool();
  const before = { ...counts };
  const container = document.createElement("section");
  const targets = Array.from({ length: targetCount }, () => document.createElement("div"));
  container.append(...targets);
  document.body.append(container);
  const delivered = new Set();
  const ready = signal();
  const start = performance.now();
  const releases = targets.map((target, index) => subscribeIntersection(target, {
    rootMargin: "0px",
    threshold: index % 2 ? [0, 0.5, 0.5] : [0.5, 0],
  }, (entry) => {
    delivered.add(entry.target);
    if (delivered.size === targetCount) {
      ready.resolve();
    }
  }));
  const subscribed = performance.now();
  const active = getIntersectionObserverPoolStatsForTests();
  check(active.sharedObservers === 1 && active.subscriptions === targetCount, "Equal options did not share");
  check(delta(before).constructed === 1, "More than one native observer was allocated");
  await bounded(ready.promise);
  const cleanupStart = performance.now();
  for (let index = 0; index < releases.length - 1; index += 1) {
    releases[index]();
  }
  const beforeFinalRelease = getIntersectionObserverPoolStatsForTests();
  check(beforeFinalRelease.subscriptions === 1 && delta(before).disconnect === 0, "Observer disposed before last owner");
  releases.at(-1)();
  const releaseMs = performance.now() - cleanupStart;
  const final = emptyPool();
  const native = delta(before);
  check(native.observe === targetCount && native.unobserve === targetCount && native.disconnect === 1, "Native disposal mismatch");
  container.remove();
  return {
    targets: targetCount,
    subscribeMs: subscribed - start,
    nativeDeliveryWaitMs: cleanupStart - subscribed,
    releaseMs,
    active,
    beforeFinalRelease,
    final,
    native,
    deliveredTargets: delivered.size,
  };
}

function Target() {
  const { ref } = useIntersectionObserver({ rootMargin: "0px", threshold: [0, 0.5] });
  return createElement(Show.div, { ref, when: true }, "target");
}

async function mountSample({ targets, iterations }) {
  const before = { ...counts };
  let mountMs = 0;
  let unmountMs = 0;
  const batchStart = performance.now();
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    emptyPool();
    const container = document.createElement("section");
    document.body.append(container);
    const expected = counts.observe + targets;
    const ready = signal();
    onObserve = () => {
      if (counts.observe === expected) {
        ready.resolve();
      }
    };
    const start = performance.now();
    const root = createRoot(container);
    flushSync(() => root.render(
      Array.from({ length: targets }, (_, key) => createElement(Target, { key })),
    ));
    await bounded(ready.promise);
    mountMs += performance.now() - start;
    onObserve = undefined;
    check(container.childElementCount === targets, "React did not mount all targets");
    const active = getIntersectionObserverPoolStatsForTests();
    check(active.subscriptions === targets && active.sharedObservers === 1, "Mount subscription mismatch");
    const unmountStart = performance.now();
    flushSync(() => root.unmount());
    unmountMs += performance.now() - unmountStart;
    check(container.childElementCount === 0, "React did not unmount targets");
    emptyPool();
    container.remove();
  }
  const elapsedMs = performance.now() - batchStart;
  const native = delta(before);
  check(native.constructed === iterations && native.disconnect === iterations, "Mount native lifecycle mismatch");
  check(native.observe === targets * iterations && native.unobserve === targets * iterations, "Mount target lifecycle mismatch");
  return {
    iterations,
    targetsPerMount: targets,
    targetLifecycles: targets * iterations,
    mountMs,
    unmountMs,
    elapsedMs,
    targetLifecyclesPerSecond: targets * iterations * 1000 / elapsedMs,
    native,
  };
}

async function prepareRetention(targetCount) {
  emptyPool();
  observerRefs = [];
  retentionRefs = { targets: [], payloads: [], roots: [], observers: observerRefs, controlTargets: [], controlPayloads: [] };
  const root = document.createElement("section");
  document.body.append(root);
  retentionRefs.roots.push(new WeakRef(root));
  const ready = signal();
  let delivered = 0;
  const releases = Array.from({ length: targetCount }, () => {
    const target = document.createElement("div");
    const payload = { target, deliveries: 0 };
    root.append(target);
    retentionRefs.targets.push(new WeakRef(target));
    retentionRefs.payloads.push(new WeakRef(payload));
    return subscribeIntersection(target, { root }, () => {
      payload.deliveries += 1;
      delivered += 1;
      if (delivered === targetCount) {
        ready.resolve();
      }
    });
  });
  await bounded(ready.promise);
  for (const release of releases) {
    release();
  }
  // Detach only after real subscriptions release. Never scrub React or DOM internals.
  root.remove();
  observerRefs = undefined;
  retainedControl = Array.from({ length: targetCount }, () => {
    const target = document.createElement("div");
    const payload = { target };
    retentionRefs.controlTargets.push(new WeakRef(target));
    retentionRefs.controlPayloads.push(new WeakRef(payload));
    return payload;
  });
  emptyPool();
  // Locals including release closures leave scope before the driver's GC command.
}

window.utilinentBench = {
  async measure(config) {
    for (let index = 0; index < config.warmup; index += 1) {
      lazySample(config);
      await observerSample(config.targets);
      await mountSample(config);
    }
    const samples = [];
    for (let index = 0; index < config.samples; index += 1) {
      samples.push({
        index,
        lazy: lazySample(config),
        observer: await observerSample(config.targets),
        mount: await mountSample(config),
      });
    }
    return { samples };
  },
  prepareRetention,
  releaseControl() {
    retainedControl = undefined;
  },
  readRetention() {
    return Object.fromEntries(Object.entries(retentionRefs).map(([key, refs]) => [
      key, refs.filter((ref) => ref.deref() !== undefined).length,
    ]));
  },
  finish() {
    const pool = emptyPool();
    check(retainedControl === undefined, "Control remains owned");
    check(document.querySelectorAll("section").length === 0, "Benchmark left DOM containers mounted");
    window.IntersectionObserver = NativeObserver;
    return { pool, domContainers: 0, nativeObserverRestored: true, lifecycleChecksPassed: true };
  },
};

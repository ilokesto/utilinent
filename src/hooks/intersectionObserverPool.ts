/**
 * Internal shared registry of native `IntersectionObserver` instances.
 *
 * Subscriptions with the same root element, `rootMargin` and normalized
 * threshold values reuse one native observer; per-target handlers are routed
 * by entry target. The shared observer is disconnected and removed from the
 * registry when its last subscription is released, so nothing observes or
 * references a target after the final unsubscribe. Not part of the public API.
 */

/** Record handler invoked for each delivered entry of the observed target. */
export type IntersectionRecordHandler = (entry: IntersectionObserverEntry) => void;

export interface IntersectionSubscriptionInit {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | readonly number[];
}

/**
 * Normalizes a scalar or array threshold into ascending unique values.
 *
 * Value-based normalization treats `[0.5]` like `0.5`, and `[0.5, 0]`
 * like `[0, 0.5, 0.5]`. Subscriptions only change when the value set
 * changes. An empty array falls back to the default `[0]`.
 */
export function normalizeThreshold(
  threshold?: number | readonly number[],
): number[] {
  const values = typeof threshold === "number" ? [threshold] : (threshold ?? []);
  if (values.length === 0) {
    return [0];
  }
  return [...new Set(values)].sort((a, b) => a - b);
}

/**
 * Registry key singleton representing the implicit viewport root
 * (`root: null`), so a real root element is never held strongly by the
 * registry itself. An object singleton works as a WeakMap key.
 */
const VIEWPORT_ROOT: object = {};

interface SharedIntersectionObserver {
  readonly observer: IntersectionObserver;
  readonly targets: Map<Element, Set<IntersectionRecordHandler>>;
}

const registry = new WeakMap<
  object,
  Map<string, Map<string, SharedIntersectionObserver>>
>();

let sharedObserverCount = 0;
let subscriptionCount = 0;

function thresholdKeyOf(thresholds: readonly number[]): string {
  return thresholds.join(",");
}

function resolveShared(
  rootKey: object,
  rootMargin: string,
  thresholdKey: string,
): SharedIntersectionObserver | undefined {
  return registry.get(rootKey)?.get(rootMargin)?.get(thresholdKey);
}

function releaseSubscription(
  rootKey: object,
  rootMargin: string,
  thresholdKey: string,
  target: Element,
  handler: IntersectionRecordHandler,
): void {
  subscriptionCount = Math.max(0, subscriptionCount - 1);

  const shared = resolveShared(rootKey, rootMargin, thresholdKey);
  if (!shared) {
    return;
  }

  const handlers = shared.targets.get(target);
  if (!handlers) {
    return;
  }

  handlers.delete(handler);
  if (handlers.size === 0) {
    shared.targets.delete(target);
    // Only this target stops; other targets of the shared observer continue.
    shared.observer.unobserve(target);
  }

  if (shared.targets.size === 0) {
    // Final unsubscribe: dispose the native observer and registry entry.
    shared.observer.disconnect();
    const rootMarginMap = registry.get(rootKey);
    const thresholdMap = rootMarginMap?.get(rootMargin);
    thresholdMap?.delete(thresholdKey);
    if (thresholdMap && thresholdMap.size === 0) {
      rootMarginMap?.delete(rootMargin);
    }
    sharedObserverCount = Math.max(0, sharedObserverCount - 1);
  }
}

/**
 * Subscribes `handler` to intersection records of `target` on a native
 * observer shared by equal options. Returns an idempotent release function.
 */
export function subscribeIntersection(
  target: Element,
  init: IntersectionSubscriptionInit,
  handler: IntersectionRecordHandler,
): () => void {
  // SSR or environments without the native API: nothing to share or observe.
  if (typeof IntersectionObserver === "undefined") {
    return () => undefined;
  }

  const rootKey: object = init.root ?? VIEWPORT_ROOT;
  const rootMargin = init.rootMargin ?? "0px";
  const thresholds = normalizeThreshold(init.threshold);
  const thresholdKey = thresholdKeyOf(thresholds);

  let rootMarginMap = registry.get(rootKey);
  if (!rootMarginMap) {
    rootMarginMap = new Map<string, Map<string, SharedIntersectionObserver>>();
    registry.set(rootKey, rootMarginMap);
  }
  let thresholdMap = rootMarginMap.get(rootMargin);
  if (!thresholdMap) {
    thresholdMap = new Map<string, SharedIntersectionObserver>();
    rootMarginMap.set(rootMargin, thresholdMap);
  }
  let shared = thresholdMap.get(thresholdKey);
  if (!shared) {
    const observer = new IntersectionObserver(
      (entries) => {
        // A queued callback from a disconnected observer must not reach a
        // replacement subscription registered under the same options.
        const current = resolveShared(rootKey, rootMargin, thresholdKey);
        if (!current || current.observer !== observer) {
          return;
        }
        for (const entry of entries) {
          const entryHandlers = current.targets.get(entry.target);
          if (!entryHandlers) {
            continue;
          }
          for (const entryHandler of [...entryHandlers]) {
            entryHandler(entry);
          }
        }
      },
      { root: init.root ?? null, rootMargin, threshold: thresholds },
    );
    shared = { observer, targets: new Map() };
    thresholdMap.set(thresholdKey, shared);
    sharedObserverCount += 1;
  }

  let handlers = shared.targets.get(target);
  if (!handlers) {
    handlers = new Set<IntersectionRecordHandler>();
    shared.targets.set(target, handlers);
    shared.observer.observe(target);
  }
  handlers.add(handler);
  subscriptionCount += 1;

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    releaseSubscription(rootKey, rootMargin, thresholdKey, target, handler);
  };
}

/**
 * Test-only introspection of the shared registry: live shared observers and
 * active subscriptions. Both return to zero once every subscriber released.
 */
export function getIntersectionObserverPoolStatsForTests(): {
  sharedObservers: number;
  subscriptions: number;
} {
  return { sharedObservers: sharedObserverCount, subscriptions: subscriptionCount };
}

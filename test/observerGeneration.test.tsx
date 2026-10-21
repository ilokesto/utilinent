import { afterEach, expect, it, vi } from "vitest";
import { subscribeIntersection } from "../src/hooks/intersectionObserverPool";
import { installControlledIntersectionObserver } from "./controlledIntersectionObserver";

afterEach(() => vi.unstubAllGlobals());

it("observer pool: released native generation delivers late record -> replacement subscriber ignores it", () => {
  installControlledIntersectionObserver();
  const NativeObserver = globalThis.IntersectionObserver;
  const deliveries: Array<(target: Element) => void> = [];
  vi.stubGlobal("IntersectionObserver", class extends NativeObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      super(callback, options);
      deliveries.push((target) => {
        const rect = new DOMRectReadOnly();
        callback([{
          target, isIntersecting: true, intersectionRatio: 1,
          boundingClientRect: rect, intersectionRect: rect,
          rootBounds: null, time: 0,
        }], this);
      });
    }
  });
  const target = document.createElement("div");
  const releaseOld = subscribeIntersection(target, {}, vi.fn());
  releaseOld();
  const replacement = vi.fn();
  const releaseNew = subscribeIntersection(target, {}, replacement);

  try {
    expect(deliveries).toHaveLength(2);
    deliveries[0]?.(target);

    expect(replacement).not.toHaveBeenCalled();
    deliveries[1]?.(target);
    expect(replacement).toHaveBeenCalledTimes(1);
  } finally {
    releaseNew();
  }
});

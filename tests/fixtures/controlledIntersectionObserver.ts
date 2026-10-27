import { act } from "@testing-library/react";

const observers: ControlledIntersectionObserver[] = [];

/**
 * Test double for `IntersectionObserver` that supports multiple targets per
 * observer and records construction/disposal so tests can measure native
 * observer counts and lifetimes deterministically.
 */
class ControlledIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];
  readonly targets = new Set<Element>();
  disconnected = false;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.rootMargin = options.rootMargin ?? "0px";
    this.thresholds = Array.isArray(options.threshold)
      ? [...options.threshold].sort((a, b) => a - b)
      : [options.threshold ?? 0];
    observers.push(this);
  }

  observe(target: Element) {
    this.targets.add(target);
    this.disconnected = false;
  }

  unobserve(target: Element) {
    this.targets.delete(target);
  }

  disconnect() {
    this.targets.clear();
    this.disconnected = true;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  isObserving(target: Element) {
    return this.targets.has(target);
  }

  get active() {
    return this.targets.size > 0;
  }

  private createEntry(
    target: Element,
    isIntersecting: boolean,
    intersectionRatio: number,
  ): IntersectionObserverEntry {
    const rect = new DOMRectReadOnly();
    return {
      boundingClientRect: rect,
      intersectionRatio,
      intersectionRect: rect,
      isIntersecting,
      rootBounds: null,
      target,
      time: 0,
    };
  }

  emit(isIntersecting: boolean) {
    const entries = [...this.targets].map((target) =>
      this.createEntry(target, isIntersecting, isIntersecting ? 1 : 0),
    );
    if (entries.length > 0) {
      this.callback(entries, this);
    }
  }

  emitForTarget(
    target: Element,
    isIntersecting: boolean,
    intersectionRatio = isIntersecting ? 1 : 0,
  ) {
    if (!this.targets.has(target)) {
      return;
    }
    this.callback([this.createEntry(target, isIntersecting, intersectionRatio)], this);
  }
}

export function installControlledIntersectionObserver() {
  observers.length = 0;
  globalThis.IntersectionObserver = ControlledIntersectionObserver;
}

export interface IntersectionObserverMetrics {
  /** Native observer instances constructed since install. */
  readonly created: number;
  /** Instances whose `disconnect()` has cleared every target. */
  readonly disconnected: number;
  /** Sum of currently observed targets across all instances. */
  readonly observing: number;
}

export function intersectionObserverMetrics(): IntersectionObserverMetrics {
  return {
    created: observers.length,
    disconnected: observers.filter((observer) => observer.disconnected).length,
    observing: observers.reduce((sum, observer) => sum + observer.targets.size, 0),
  };
}

function getActiveObserver() {
  const observer = [...observers].reverse().find((candidate) => candidate.active);
  if (!observer) {
    throw new Error("Expected an active IntersectionObserver");
  }

  return observer;
}

function getObserverForTarget(target: Element) {
  const observer = [...observers]
    .reverse()
    .find((candidate) => candidate.isObserving(target));
  if (!observer) {
    throw new Error("Expected an active IntersectionObserver for the requested target");
  }

  return observer;
}

export function hasActiveIntersectionObserver() {
  return observers.some((observer) => observer.active);
}

export async function emitIntersection(isIntersecting: boolean) {
  const observer = getActiveObserver();

  await act(async () => {
    observer.emit(isIntersecting);
    await Promise.resolve();
  });
}

export async function emitIntersectionForTarget(
  target: Element,
  isIntersecting: boolean,
  intersectionRatio?: number,
) {
  const observer = getObserverForTarget(target);

  await act(async () => {
    observer.emitForTarget(target, isIntersecting, intersectionRatio);
    await Promise.resolve();
  });
}

export async function enterViewport() {
  const observer = getActiveObserver();

  await act(async () => {
    observer.emit(false);
    observer.emit(true);
    await Promise.resolve();
  });
}

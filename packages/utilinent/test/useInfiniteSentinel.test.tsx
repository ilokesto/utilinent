import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useInfiniteSentinel, type UseInfiniteSentinelOptions } from "../src/hooks";
import {
  emitIntersectionForTarget, installControlledIntersectionObserver,
  intersectionObserverMetrics,
} from "./controlledIntersectionObserver";

beforeEach(installControlledIntersectionObserver);
afterEach(() => vi.unstubAllGlobals());

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function mountSentinel(options: UseInfiniteSentinelOptions) {
  const hook = renderHook((props) => useInfiniteSentinel(props), { initialProps: options });
  const target = document.createElement("div");
  act(() => hook.result.current.ref(target));
  return { ...hook, target };
}

it("useInfiniteSentinel: repeated records and re-entry -> one load per entry", async () => {
  const onLoadMore = vi.fn();
  const { target, result } = mountSentinel({ onLoadMore, hasMore: true });

  await emitIntersectionForTarget(target, true);
  await emitIntersectionForTarget(target, true);
  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(result.current.isIntersecting).toBe(true);
  await emitIntersectionForTarget(target, false);
  expect(result.current.isIntersecting).toBe(false);
  await emitIntersectionForTarget(target, true);

  expect(onLoadMore).toHaveBeenCalledTimes(2);
  expect(result.current.isLoading).toBe(false);
});

it("useInfiniteSentinel: busy ends while visible -> requests another page without re-entry", async () => {
  const onLoadMore = vi.fn();
  const options = { onLoadMore, hasMore: true, busy: false };
  const { target, rerender, result } = mountSentinel(options);
  await emitIntersectionForTarget(target, true);
  rerender({ ...options, busy: true });
  expect(result.current.isLoading).toBe(true);

  await act(async () => rerender(options));

  expect(onLoadMore).toHaveBeenCalledTimes(2);
});

it("useInfiniteSentinel: queued busy cycle during a promise -> waits for its owner", async () => {
  const first = deferred();
  const onLoadMore = vi.fn<UseInfiniteSentinelOptions["onLoadMore"]>()
    .mockReturnValueOnce(first.promise);
  const options = { onLoadMore, hasMore: true, busy: false };
  const { target, rerender } = mountSentinel(options);
  await emitIntersectionForTarget(target, true);
  await emitIntersectionForTarget(target, false);
  await emitIntersectionForTarget(target, true);
  rerender({ ...options, busy: true });
  rerender(options);
  expect(onLoadMore).toHaveBeenCalledTimes(1);

  await act(async () => { first.resolve(); await first.promise; });

  expect(onLoadMore).toHaveBeenCalledTimes(2);
});

it("useInfiniteSentinel: promise settles without a busy cycle -> does not loop", async () => {
  const request = deferred();
  const onLoadMore = vi.fn(() => request.promise);
  const { target, result } = mountSentinel({ onLoadMore, hasMore: true });
  await emitIntersectionForTarget(target, true);
  expect(result.current.isLoading).toBe(true);

  await act(async () => { request.resolve(); await request.promise; });

  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(result.current.isLoading).toBe(false);
});

it.each(["busy", "disabled", "hasMore"] as const)(
  "useInfiniteSentinel: %s blocks entry and retry -> resumes when allowed",
  async (gate) => {
    const onLoadMore = vi.fn();
    const options = { onLoadMore, hasMore: true, busy: false, disabled: false };
    const blocked = { ...options, [gate]: gate !== "hasMore" };
    const { target, result, rerender } = mountSentinel(blocked);
    await emitIntersectionForTarget(target, true);
    act(() => result.current.retry());
    expect(onLoadMore).not.toHaveBeenCalled();

    await act(async () => rerender(options));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  },
);

it("useInfiniteSentinel: no more pages after completion -> busy release stays stopped", async () => {
  const request = deferred();
  const onLoadMore = vi.fn(() => request.promise);
  const options = { onLoadMore, hasMore: true, busy: false };
  const { target, rerender } = mountSentinel(options);
  await emitIntersectionForTarget(target, true);
  rerender({ ...options, busy: true });
  rerender({ ...options, hasMore: false });

  await act(async () => { request.resolve(); await request.promise; });
  await emitIntersectionForTarget(target, false);
  await emitIntersectionForTarget(target, true);

  expect(onLoadMore).toHaveBeenCalledTimes(1);
});

it("useInfiniteSentinel: rejected request and busy release -> latches until explicit retry", async () => {
  const request = deferred();
  const error = new Error("offline");
  const onError = vi.fn();
  const onLoadMore = vi.fn<UseInfiniteSentinelOptions["onLoadMore"]>()
    .mockReturnValueOnce(request.promise);
  const options = { onLoadMore, onError, hasMore: true, busy: false };
  const { target, rerender, result } = mountSentinel(options);
  await emitIntersectionForTarget(target, true);
  rerender({ ...options, busy: true });
  await act(async () => { request.reject(error); await request.promise.catch(() => {}); });
  rerender(options);
  await emitIntersectionForTarget(target, true);
  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledExactlyOnceWith(error);
  expect(result.current.error).toBe(error);

  await act(async () => result.current.retry());

  expect(onLoadMore).toHaveBeenCalledTimes(2);
  expect(result.current.error).toBeUndefined();
});

it("useInfiniteSentinel: synchronous throw -> retries only after leaving and entering", async () => {
  const error = new Error("sync failure");
  const onLoadMore = vi.fn(() => { throw error; });
  const { target, result } = mountSentinel({ onLoadMore, hasMore: true });
  await emitIntersectionForTarget(target, true);
  await emitIntersectionForTarget(target, true);
  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(result.current.error).toBe(error);

  await emitIntersectionForTarget(target, false);
  await emitIntersectionForTarget(target, true);

  expect(onLoadMore).toHaveBeenCalledTimes(2);
});

it("useInfiniteSentinel: callback changes -> keeps subscription and uses latest committed callback", async () => {
  const first = vi.fn();
  const second = vi.fn();
  const { target, rerender } = mountSentinel({ onLoadMore: first, hasMore: true, threshold: [0, 0.5] });
  await emitIntersectionForTarget(target, true);
  rerender({ onLoadMore: second, hasMore: true, threshold: [0.5, 0, 0.5] });
  expect(second).not.toHaveBeenCalled();
  expect(intersectionObserverMetrics().created).toBe(1);

  await emitIntersectionForTarget(target, false);
  await emitIntersectionForTarget(target, true);

  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
});

it("useInfiniteSentinel: promise rejects after unmount -> releases observer without error delivery", async () => {
  const request = deferred();
  const onError = vi.fn();
  const onLoadMore = vi.fn(() => request.promise);
  const { target, unmount, result } = mountSentinel({ onLoadMore, onError, hasMore: true });
  const retry = result.current.retry;
  await emitIntersectionForTarget(target, true);

  unmount();
  await act(async () => { request.reject(new Error("late")); await request.promise.catch(() => {}); });
  act(retry);

  expect(onError).not.toHaveBeenCalled();
  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(intersectionObserverMetrics().observing).toBe(0);
});

it("useInfiniteSentinel: target swap -> old visibility never loads the replacement", async () => {
  const onLoadMore = vi.fn();
  const { target, result } = mountSentinel({ onLoadMore, hasMore: true });
  await emitIntersectionForTarget(target, true);
  const replacement = document.createElement("div");

  act(() => result.current.ref(replacement));

  expect(result.current.isIntersecting).toBe(false);
  expect(onLoadMore).toHaveBeenCalledTimes(1);
  await emitIntersectionForTarget(replacement, true);
  expect(onLoadMore).toHaveBeenCalledTimes(2);
});

it("useInfiniteSentinel: observer unavailable -> manual retry remains usable", async () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  const onLoadMore = vi.fn();
  const { result } = mountSentinel({ onLoadMore, hasMore: true });
  expect(onLoadMore).not.toHaveBeenCalled();

  await act(async () => result.current.retry());

  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(result.current.isIntersecting).toBe(false);
});

it("useInfiniteSentinel: custom root and threshold -> loads only at the requested intersection", async () => {
  const NativeObserver = globalThis.IntersectionObserver;
  const configurations: IntersectionObserverInit[] = [];
  vi.stubGlobal("IntersectionObserver", class extends NativeObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      super(callback, options);
      configurations.push(options ?? {});
    }
  });
  const root = document.createElement("section");
  const onLoadMore = vi.fn();
  const { target } = mountSentinel({ onLoadMore, hasMore: true, root, rootMargin: "100px", threshold: 0.5 });
  await emitIntersectionForTarget(target, true, 0.4);
  expect(onLoadMore).not.toHaveBeenCalled();

  await emitIntersectionForTarget(target, true, 0.6);

  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(configurations).toEqual([{ root, rootMargin: "100px", threshold: [0.5] }]);
});

it("useInfiniteSentinel: pending target detaches -> settlement clears loading without notifying", async () => {
  const request = deferred();
  const onError = vi.fn();
  const { target, result } = mountSentinel({ onLoadMore: () => request.promise, onError, hasMore: true });
  await emitIntersectionForTarget(target, true);
  act(() => result.current.ref(null));

  await act(async () => { request.reject("detached"); await request.promise.catch(() => {}); });

  expect(result.current.isLoading).toBe(false);
  expect(onError).not.toHaveBeenCalled();
});

it("useInfiniteSentinel: error callback changes during pending work -> notifies the latest callback", async () => {
  const request = deferred();
  const oldError = vi.fn();
  const newError = vi.fn();
  const options = { onLoadMore: () => request.promise, onError: oldError, hasMore: true };
  const { target, rerender } = mountSentinel(options);
  await emitIntersectionForTarget(target, true);
  rerender({ ...options, onError: newError });

  await act(async () => { request.reject("failed"); await request.promise.catch(() => {}); });

  expect(oldError).not.toHaveBeenCalled();
  expect(newError).toHaveBeenCalledExactlyOnceWith("failed");
});

import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedCallback, useThrottledCallback } from "../../src/hooks";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe.each([
  ["useDebouncedCallback", useDebouncedCallback],
  ["useThrottledCallback", useThrottledCallback],
] as const)("%s shared contract", (_name, useTimedCallback) => {
  it("calls: variadic arguments -> latest committed callback receives the latest tuple", () => {
    const first = vi.fn((name: string, count: number) => `${name}:${count}`);
    const latest = vi.fn((name: string, count: number) => `${name}:${count * 2}`);
    const { result, rerender } = renderHook(
      ({ callback }) => useTimedCallback(callback, 100, { leading: false }),
      { initialProps: { callback: first } },
    );
    const initial = result.current;

    act(() => {
      expect(result.current("old", 1)).toBeUndefined();
      result.current("new", 2);
    });
    rerender({ callback: latest });
    act(() => vi.advanceTimersByTime(100));

    expect(result.current).toBe(initial);
    expect(result.current.cancel).toBe(initial.cancel);
    expect(result.current.flush).toBe(initial.flush);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith("new", 2);
    expect(result.current.flush()).toBe("new:4");
  });

  it("calls: both edges with one call -> leading execution is not duplicated", () => {
    const callback = vi.fn(() => 42);
    const { result } = renderHook(() =>
      useTimedCallback(callback, 100, { leading: true, trailing: true }),
    );

    act(() => {
      expect(result.current()).toBeUndefined();
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(result.current.flush()).toBe(42);
  });

  it("calls: leading-only burst -> suppressed calls are discarded", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useTimedCallback(callback, 100, { leading: true, trailing: false }),
    );

    act(() => {
      result.current("first");
      result.current("discarded");
      vi.advanceTimersByTime(100);
      result.current("next");
      vi.advanceTimersByTime(100);
    });

    expect(callback.mock.calls).toEqual([["first"], ["next"]]);
  });

  it("calls: both edges disabled -> no execution or timers", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useTimedCallback(callback, 100, { leading: false, trailing: false }),
    );

    act(() => {
      result.current();
      result.current.flush();
      vi.advanceTimersByTime(100);
    });

    expect(callback).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancel: pending trailing call -> no invocation and next window is fresh", () => {
    const callback = vi.fn((value: string) => value);
    const { result } = renderHook(() =>
      useTimedCallback(callback, 100, { leading: false }),
    );

    act(() => {
      result.current("discarded");
      result.current.cancel();
      expect(result.current.flush()).toBeUndefined();
      vi.advanceTimersByTime(100);
      result.current("next");
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledExactlyOnceWith("next");
  });

  it("flush: pending work -> invokes once and retains last result after cancellation", () => {
    const callback = vi.fn((value: number) => value * 2);
    const { result } = renderHook(() =>
      useTimedCallback(callback, 100, { leading: false }),
    );

    act(() => {
      expect(result.current.flush()).toBeUndefined();
      result.current(3);
      expect(result.current.flush()).toBe(6);
      expect(result.current.flush()).toBe(6);
      result.current(4);
      result.current.cancel();
      expect(result.current.flush()).toBe(6);
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledExactlyOnceWith(3);
  });

  it.each([
    { wait: 200, leading: false, trailing: true },
    { wait: 100, leading: true, trailing: true },
    { wait: 100, leading: false, trailing: false },
  ])("options: change to %j -> cancels prior work without changing identity", (next) => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      (config) => useTimedCallback(callback, config.wait, config),
      { initialProps: { wait: 100, leading: false, trailing: true } },
    );
    const initial = result.current;

    act(() => result.current("discarded"));
    rerender(next);
    act(() => vi.advanceTimersByTime(300));

    expect(result.current).toBe(initial);
    expect(callback).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("options: equivalent new object -> preserves pending work", () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(() =>
      useTimedCallback(callback, 100, { leading: false, trailing: true }),
    );

    act(() => result.current("kept"));
    rerender();
    act(() => vi.advanceTimersByTime(100));

    expect(callback).toHaveBeenCalledExactlyOnceWith("kept");
  });

  it("options: change wait -> new calls use the new delay", () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ wait }) => useTimedCallback(callback, wait, { leading: false }),
      { initialProps: { wait: 100 } },
    );

    rerender({ wait: 200 });
    act(() => {
      result.current();
      vi.advanceTimersByTime(199);
    });
    expect(callback).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("unmount: pending work in StrictMode -> clears every timer", () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(
      () => useTimedCallback(callback, 100, { leading: false }),
      { wrapper: ({ children }) => <StrictMode>{children}</StrictMode> },
    );

    act(() => result.current("discarded"));
    unmount();
    act(() => vi.advanceTimersByTime(200));

    expect(callback).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([0, -10])("wait: %i milliseconds -> trailing execution is deferred", (wait) => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useTimedCallback(callback, wait, { leading: false }),
    );

    act(() => result.current());
    expect(callback).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(0));

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe("useDebouncedCallback", () => {
  it("default: burst of calls -> waits for silence and uses the last arguments", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 100));

    act(() => {
      result.current("first");
      vi.advanceTimersByTime(60);
      result.current("last");
      vi.advanceTimersByTime(99);
    });
    expect(callback).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));

    expect(callback).toHaveBeenCalledExactlyOnceWith("last");
  });

  it("both edges: repeated burst -> leading and last trailing call execute", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(callback, 100, { leading: true }),
    );

    act(() => {
      result.current("first");
      vi.advanceTimersByTime(60);
      result.current("middle");
      vi.advanceTimersByTime(60);
      result.current("last");
      vi.advanceTimersByTime(100);
    });

    expect(callback.mock.calls).toEqual([["first"], ["last"]]);
  });

  it("flush: pending burst -> ends the debounce window for the next leading call", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(callback, 100, { leading: true }),
    );

    act(() => {
      result.current("first");
      result.current("pending");
      result.current.flush();
      result.current("fresh");
      vi.advanceTimersByTime(100);
    });

    expect(callback.mock.calls).toEqual([["first"], ["pending"], ["fresh"]]);
  });

  it("callback: reentrant trailing call -> preserves newly scheduled work", () => {
    const callback = vi.fn((value: number) => {
      if (value === 1) {
        result.current(2);
      }
    });
    const { result } = renderHook(() => useDebouncedCallback(callback, 100));

    act(() => {
      result.current(1);
      vi.advanceTimersByTime(200);
    });

    expect(callback.mock.calls).toEqual([[1], [2]]);
  });
});

describe("useThrottledCallback", () => {
  it("default: continuous calls -> fixed windows execute latest arguments", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 100));

    act(() => {
      result.current("first");
      vi.advanceTimersByTime(60);
      result.current("second");
      vi.advanceTimersByTime(40);
      result.current("third");
      vi.advanceTimersByTime(99);
    });
    expect(callback.mock.calls).toEqual([["first"], ["second"]]);
    act(() => vi.advanceTimersByTime(1));

    expect(callback.mock.calls).toEqual([["first"], ["second"], ["third"]]);
  });

  it("trailing-only: repeated calls -> does not postpone the first boundary", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(callback, 100, { leading: false }),
    );

    act(() => {
      result.current("first");
      vi.advanceTimersByTime(60);
      result.current("last");
      vi.advanceTimersByTime(39);
    });
    expect(callback).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));

    expect(callback).toHaveBeenCalledExactlyOnceWith("last");
  });

  it("flush: pending call -> starts cooldown at the flushed invocation", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 100));

    act(() => {
      result.current("first");
      vi.advanceTimersByTime(50);
      result.current("pending");
      result.current.flush();
      result.current("last");
      vi.advanceTimersByTime(99);
    });
    expect(callback.mock.calls).toEqual([["first"], ["pending"]]);
    act(() => vi.advanceTimersByTime(1));

    expect(callback.mock.calls).toEqual([["first"], ["pending"], ["last"]]);
  });

  it("callback: reentrant trailing call -> respects the next cooldown", () => {
    const callback = vi.fn((value: number) => {
      if (value === 1) {
        result.current(2);
      }
    });
    const { result } = renderHook(() =>
      useThrottledCallback(callback, 100, { leading: false }),
    );

    act(() => {
      result.current(1);
      vi.advanceTimersByTime(199);
    });
    expect(callback.mock.calls).toEqual([[1]]);
    act(() => vi.advanceTimersByTime(1));

    expect(callback.mock.calls).toEqual([[1], [2]]);
  });
});

import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePendingDelay, type UsePendingDelayOptions } from "../../src/hooks";

interface PendingProps extends UsePendingDelayOptions {
  pending: boolean;
}

function usePendingProbe({ pending, ...options }: PendingProps) {
  return usePendingDelay(pending, options);
}

function advance(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

describe("usePendingDelay", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("usePendingDelay: idle -> no pending UI or timer", () => {
    const { result } = renderHook(() => usePendingDelay(false));

    expect(result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("usePendingDelay: initially pending -> reveals at default delay and holds from reveal", () => {
    const { result, rerender } = renderHook(usePendingProbe, {
      initialProps: { pending: true },
    });
    expect(result.current).toBe(false);
    advance(199);
    expect(result.current).toBe(false);

    advance(1);
    expect(result.current).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    rerender({ pending: false });
    advance(299);
    expect(result.current).toBe(true);
    advance(1);
    expect(result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("usePendingDelay: request finishes before delay -> cancels reveal without flashing", () => {
    const { result, rerender } = renderHook(usePendingProbe, {
      initialProps: { pending: true, delay: 100 },
    });
    advance(99);

    rerender({ pending: false, delay: 100 });
    advance(1000);

    expect(result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("usePendingDelay: reveal commit is deferred -> minimum duration starts at the visible commit", () => {
    const options = { delay: 100, minDuration: 200 };
    const { result, rerender } = renderHook(usePendingProbe, {
      initialProps: { pending: true, ...options },
    });
    // React flushes the queued reveal after the fake clock finishes advancing.
    advance(1000);
    expect(result.current).toBe(true);

    rerender({ pending: false, ...options });
    advance(199);

    expect(result.current).toBe(true);
    advance(1);
    expect(result.current).toBe(false);
  });

  it("usePendingDelay: consecutive short requests -> each receives a fresh delay", () => {
    const { result, rerender } = renderHook(usePendingProbe, {
      initialProps: { pending: true, delay: 100 },
    });
    advance(90);
    rerender({ pending: false, delay: 100 });

    rerender({ pending: true, delay: 100 });
    advance(99);
    expect(result.current).toBe(false);
    advance(1);
    expect(result.current).toBe(true);
  });

  it("usePendingDelay: long request finishes -> hides immediately without a timer", () => {
    const { result, rerender } = renderHook(usePendingProbe, {
      initialProps: { pending: true, delay: 100, minDuration: 200 },
    });
    advance(100);
    advance(201);
    expect(result.current).toBe(true);
    expect(vi.getTimerCount()).toBe(0);

    rerender({ pending: false, delay: 100, minDuration: 200 });

    expect(result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("usePendingDelay: pending restarts during hold -> cancels hide and preserves reveal time", () => {
    const options = { delay: 100, minDuration: 300 };
    const { result, rerender } = renderHook(usePendingProbe, {
      initialProps: { pending: true, ...options },
    });
    advance(100);
    rerender({ pending: false, ...options });
    advance(100);

    rerender({ pending: true, ...options });
    expect(vi.getTimerCount()).toBe(0);
    advance(201);
    expect(result.current).toBe(true);
    rerender({ pending: false, ...options });
    expect(result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("usePendingDelay: delay changes -> recalculates against original pending start", () => {
    const { result, rerender } = renderHook(usePendingProbe, {
      initialProps: { pending: true, delay: 100 },
    });
    advance(50);

    rerender({ pending: true, delay: 200 });
    advance(149);
    expect(result.current).toBe(false);
    advance(1);
    expect(result.current).toBe(true);
    rerender({ pending: true, delay: 1000 });
    expect(result.current).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("usePendingDelay: delay shortened past elapsed time -> reveals without another timer", () => {
    const { result, rerender } = renderHook(usePendingProbe, {
      initialProps: { pending: true, delay: 200 },
    });
    advance(100);

    rerender({ pending: true, delay: 50 });

    expect(result.current).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("usePendingDelay: minimum changes during hold -> extends then shortens original deadline", () => {
    const { result, rerender } = renderHook(usePendingProbe, {
      initialProps: { pending: true, delay: 0, minDuration: 100 },
    });
    rerender({ pending: false, delay: 0, minDuration: 100 });
    advance(50);

    rerender({ pending: false, delay: 0, minDuration: 200 });
    advance(149);
    expect(result.current).toBe(true);
    rerender({ pending: false, delay: 0, minDuration: 150 });
    expect(result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "usePendingDelay: zero or invalid durations %s -> follows committed pending without timers",
    (duration) => {
      const options = { delay: duration, minDuration: duration };
      const { result, rerender } = renderHook(usePendingProbe, {
        initialProps: { pending: true, ...options },
      });
      expect(result.current).toBe(true);

      rerender({ pending: false, ...options });

      expect(result.current).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it.each(["delay", "hold"] as const)(
    "usePendingDelay: StrictMode unmount during %s -> owns one timer then clears it",
    (phase) => {
      const { result, rerender, unmount } = renderHook(usePendingProbe, {
        initialProps: { pending: true, delay: 100, minDuration: 200 },
        wrapper: StrictMode,
      });
      if (phase === "hold") {
        advance(100);
        rerender({ pending: false, delay: 100, minDuration: 200 });
        expect(result.current).toBe(true);
      }
      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
      advance(1000);
    },
  );
});

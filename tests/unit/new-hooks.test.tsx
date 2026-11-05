import { act, render, renderHook } from "@testing-library/react";
import { StrictMode, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useClickAway,
  useDebounce,
  useEventListener,
  useHover,
  useKey,
  useMediaQuery,
  useResizeObserver,
  useThrottle,
} from "../../src/hooks";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe.each([
  { name: "useDebounce", useValue: useDebounce },
  { name: "useThrottle", useValue: useThrottle },
])("$name callable values", ({ name, useValue }) => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
  });

  it(`${name}: initial and unchanged StrictMode renders -> returns the function without invoking it`, () => {
    const value = vi.fn(() => "initial");
    const hook = renderHook(() => useValue(value, 100), { wrapper: StrictMode });

    hook.rerender();

    expect(hook.result.current).toBe(value);
    expect(value).not.toHaveBeenCalled();
  });

  it(`${name}: rapid callable changes -> emits the latest function at the existing time boundary`, () => {
    const first = vi.fn(() => "first");
    const second = vi.fn(() => "second");
    const latest = vi.fn(() => "latest");
    const hook = renderHook(({ value }) => useValue(value, 100), { initialProps: { value: first } });
    hook.rerender({ value: second });
    act(() => vi.advanceTimersByTime(50));

    hook.rerender({ value: latest });

    act(() => vi.advanceTimersByTime(49));
    expect(hook.result.current).toBe(first);
    act(() => vi.advanceTimersByTime(1));
    expect(hook.result.current).toBe(name === "useThrottle" ? latest : first);
    act(() => vi.advanceTimersByTime(50));
    expect(hook.result.current).toBe(latest);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(latest).not.toHaveBeenCalled();
  });

  it(`${name}: unmount during a callable update -> cancels pending work without invoking values`, () => {
    const first = vi.fn(() => "first");
    const next = vi.fn(() => "next");
    const hook = renderHook(({ value }) => useValue(value, 100), { initialProps: { value: first } });
    hook.rerender({ value: next });
    expect(vi.getTimerCount()).toBe(1);

    hook.unmount();

    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(100));
    expect(first).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it(`${name}: callable and noncallable replacements -> preserves each value's identity`, () => {
    const first = vi.fn(() => "first");
    const latest = vi.fn(() => "latest");
    const initialProps: { value: string | (() => string) } = { value: first };
    const hook = renderHook(
      ({ value }: { value: string | (() => string) }) => useValue(value, 100),
      { initialProps },
    );

    hook.rerender({ value: "plain" });
    act(() => vi.advanceTimersByTime(100));
    expect(hook.result.current).toBe("plain");
    hook.rerender({ value: latest });
    act(() => vi.advanceTimersByTime(100));

    expect(hook.result.current).toBe(latest);
    expect(first).not.toHaveBeenCalled();
    expect(latest).not.toHaveBeenCalled();
  });
});

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("emits the latest value after the delay", () => {
    let latest = "init";
    function Controlled({ value }: { value: string }) {
      latest = useDebounce(value, 100);
      return null;
    }
    const { rerender } = render(<Controlled value="a" />);
    expect(latest).toBe("a");

    rerender(<Controlled value="b" />);
    expect(latest).toBe("a");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(latest).toBe("b");

    rerender(<Controlled value="c" />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(latest).toBe("c");
  });
});

describe("useThrottle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("emits immediately on the first change then waits", () => {
    let latest = 0;
    function Controlled({ value }: { value: number }) {
      latest = useThrottle(value, 100);
      return null;
    }
    const { rerender } = render(<Controlled value={1} />);
    expect(latest).toBe(1);

    rerender(<Controlled value={2} />);
    expect(latest).toBe(1);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(latest).toBe(2);
  });
});

describe("useEventListener", () => {
  it("invokes the handler for window events and cleans up", () => {
    const handler = vi.fn();
    function Probe() {
      useEventListener(window, "resize", handler);
      return null;
    }
    const { unmount } = render(<Probe />);

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    unmount();
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not invoke when disabled", () => {
    const handler = vi.fn();
    function Probe({ disabled }: { disabled: boolean }) {
      useEventListener(window, "resize", handler, { disabled });
      return null;
    }
    const { rerender } = render(<Probe disabled={true} />);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(handler).not.toHaveBeenCalled();

    rerender(<Probe disabled={false} />);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("useClickAway", () => {
  it("fires when a mousedown lands outside the ref", () => {
    const handler = vi.fn();
    function Probe() {
      const ref = useRef<HTMLDivElement>(null);
      useClickAway(ref, handler);
      return (
        <div>
          <div ref={ref} data-testid="inside">
            inside
          </div>
          <div data-testid="outside">outside</div>
        </div>
      );
    }
    const { getByTestId } = render(<Probe />);

    act(() => {
      getByTestId("inside").dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
    });
    expect(handler).not.toHaveBeenCalled();

    act(() => {
      document.body.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("useHover", () => {
  it("tracks mouseenter and mouseleave", () => {
    let hovering = false;
    function Probe() {
      const { ref, isHovering } = useHover();
      hovering = isHovering;
      return <div ref={ref} data-testid="target" />;
    }
    const { getByTestId } = render(<Probe />);
    expect(hovering).toBe(false);

    const target = getByTestId("target");
    act(() => {
      target.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    });
    expect(hovering).toBe(true);

    act(() => {
      target.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    });
    expect(hovering).toBe(false);
  });
});

describe("useKey", () => {
  it("uses the latest handler without rebinding for handler-only renders", () => {
    const firstHandler = vi.fn();
    const latestHandler = vi.fn();
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    function Probe({ handler }: { handler: (event: KeyboardEvent) => void }) {
      useKey("Escape", handler);
      return null;
    }
    const { rerender } = render(<Probe handler={firstHandler} />);

    rerender(<Probe handler={latestHandler} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));
    });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(latestHandler).toHaveBeenCalledTimes(1);
    expect(addListener.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
    expect(removeListener.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(0);
  });

  it("rebinds when the key options change", () => {
    const handler = vi.fn();
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    function Probe({ event }: { event: "keydown" | "keyup" }) {
      useKey("Escape", handler, { event });
      return null;
    }
    const { rerender } = render(<Probe event="keydown" />);

    rerender(<Probe event="keyup" />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "Escape" }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(addListener.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
    expect(removeListener.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
    expect(addListener.mock.calls.filter(([type]) => type === "keyup")).toHaveLength(1);
  });

  it("removes the subscription while disabled and restores it when enabled", () => {
    const handler = vi.fn();
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    function Probe({ enabled }: { enabled: boolean }) {
      useKey("Escape", handler, { enabled });
      return null;
    }
    const { rerender, unmount } = render(<Probe enabled={true} />);

    rerender(<Probe enabled={false} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));
    });
    rerender(<Probe enabled={true} />);
    unmount();

    expect(handler).not.toHaveBeenCalled();
    expect(addListener.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(2);
    expect(removeListener.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(2);
  });

  it("invokes the handler for the matching code", () => {
    const handler = vi.fn();
    function Probe() {
      useKey("Escape", handler);
      return null;
    }
    render(<Probe />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "Enter" }));
    });
    expect(handler).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("ignores editable targets when configured", () => {
    const handler = vi.fn();
    function Probe() {
      useKey("KeyS", handler, { ignoreEditable: true });
      return <input data-testid="input" />;
    }
    const { getByTestId } = render(<Probe />);

    act(() => {
      getByTestId("input").dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyS", bubbles: true }),
      );
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes only on keyup when configured", () => {
    const handler = vi.fn();
    function Probe() {
      useKey("Escape", handler, { event: "keyup" });
      return null;
    }
    render(<Probe />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "Escape" }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("useMediaQuery", () => {
  let matches = false;
  let listeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    matches = false;
    listeners = [];
    window.matchMedia = (query: string) =>
      ({
        matches,
        media: query,
        onchange: null,
        addEventListener: (type: string, listener: (e: MediaQueryListEvent) => void) => {
          if (type === "change") listeners.push(listener);
        },
        removeEventListener: (type: string, listener: (e: MediaQueryListEvent) => void) => {
          if (type === "change") {
            listeners = listeners.filter((l) => l !== listener);
          }
        },
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;
  });

  it("reflects the current match and updates on change", () => {
    let result = true;
    function Probe() {
      result = useMediaQuery("(min-width: 768px)");
      return null;
    }
    render(<Probe />);
    expect(result).toBe(false);

    matches = true;
    act(() => {
      for (const l of listeners) {
        l({ matches: true, media: "" } as MediaQueryListEvent);
      }
    });
    expect(result).toBe(true);
  });
});

describe("useResizeObserver", () => {
  let active: { emit: (width: number, height: number) => void } | null = null;

  beforeEach(() => {
    active = null;
    class ControlledResizeObserver {
      private target: Element | null = null;
      constructor(private cb: ResizeObserverCallback) {}
      observe(target: Element) {
        this.target = target;
        active = {
          emit: (width: number, height: number) => {
            const rect = { width, height } as DOMRectReadOnly;
            this.cb(
              [
                { contentRect: rect, target } as unknown as ResizeObserverEntry,
              ],
              this as unknown as ResizeObserver,
            );
          },
        };
      }
      unobserve() {
        this.target = null;
      }
      disconnect() {
        this.target = null;
      }
    }
    globalThis.ResizeObserver =
      ControlledResizeObserver as unknown as typeof ResizeObserver;
  });

  it("reports width and height after a resize", () => {
    let size = { width: 0, height: 0 };
    function Probe() {
      const { ref, width, height } = useResizeObserver();
      size = { width, height };
      return <div ref={ref} />;
    }
    render(<Probe />);

    act(() => {
      active?.emit(320, 240);
    });
    expect(size).toEqual({ width: 320, height: 240 });
  });
});

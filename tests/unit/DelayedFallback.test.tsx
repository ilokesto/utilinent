import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef, forwardRef, type ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DelayedFallback, PluginManager } from "../../src";

const PendingPanel = forwardRef<HTMLDivElement, { children?: ReactNode; label: string }>(
  function PendingPanel({ children, label }, ref) {
    return <div ref={ref} aria-label={label}>{children}</div>;
  },
);

declare module "../../src/types/register" {
  interface UtilinentRegister {
    delayedFallback: { PendingPanel: typeof PendingPanel };
  }
}

describe("DelayedFallback", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
    PluginManager.unregister("delayedFallback", "PendingPanel");
  });

  it("DelayedFallback: delayed pending and hold -> swaps only the content branch", () => {
    const fallback = <span role="status">Loading results</span>;
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <DelayedFallback.div ref={ref} pending delay={100} minDuration={200} fallback={fallback} data-testid="host">
        Results
      </DelayedFallback.div>,
    );
    const host = ref.current;
    expect(host).toHaveTextContent("Results");
    expect(screen.queryByRole("status")).toBeNull();
    expect(host).not.toHaveAttribute("pending");
    expect(host).not.toHaveAttribute("delay");
    expect(host).not.toHaveAttribute("minDuration");

    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole("status")).toHaveTextContent("Loading results");
    rerender(
      <DelayedFallback.div ref={ref} pending={false} delay={100} minDuration={200} fallback={fallback} data-testid="host">
        Updated results
      </DelayedFallback.div>,
    );
    act(() => vi.advanceTimersByTime(199));
    expect(screen.queryByText("Updated results")).toBeNull();
    act(() => vi.advanceTimersByTime(1));

    expect(host).toHaveTextContent("Updated results");
    expect(ref.current).toBe(host);
    expect(screen.queryByRole("status")).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("DelayedFallback: omitted children -> renders only the delayed loading indicator", () => {
    render(<DelayedFallback pending delay={0} fallback={<span role="status">Loading</span>} />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("DelayedFallback: registered target -> forwards custom props and concrete ref", () => {
    PluginManager.register({ delayedFallback: { PendingPanel } });
    const ref = createRef<HTMLDivElement>();

    render(
      <DelayedFallback.PendingPanel ref={ref} label="Search results" pending={false}>
        Ready
      </DelayedFallback.PendingPanel>,
    );

    expect(ref.current).toBe(screen.getByLabelText("Search results"));
    expect(ref.current).toHaveTextContent("Ready");
  });

  it.each([0, 100])(
    "DelayedFallback: pending SSR hydrated with delay %s -> matches then starts client timing",
    (delay) => {
      const element = (
        <DelayedFallback pending delay={delay} fallback={<span role="status">Loading</span>}>
          Ready
        </DelayedFallback>
      );
      const container = document.createElement("div");
      container.innerHTML = renderToString(element);
      expect(container.textContent).toBe("Ready");
      expect(vi.getTimerCount()).toBe(0);
      document.body.appendChild(container);
      const errors: unknown[] = [];
      let root: ReturnType<typeof hydrateRoot> | undefined;

      act(() => {
        root = hydrateRoot(container, element, { onRecoverableError: (error) => errors.push(error) });
      });
      if (delay > 0) {
        expect(container.textContent).toBe("Ready");
        act(() => vi.advanceTimersByTime(delay));
      }

      expect(container.textContent).toBe("Loading");
      expect(errors).toEqual([]);
      act(() => root?.unmount());
      container.remove();
    },
  );
});

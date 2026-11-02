import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { startTransition, StrictMode, Suspense, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useRefEffect } from "../../src/hooks";

interface ProbeProps {
  setup: (node: HTMLDivElement) => void | (() => void);
  dependency?: number;
  target?: string | null;
}

function Probe({ setup, dependency = 0, target = "target" }: ProbeProps) {
  const ref = useRefEffect(setup, [dependency]);
  return target === null ? null : <div key={target} ref={ref} data-testid={target} />;
}

describe("useRefEffect", () => {
  it("useRefEffect: a suspended owner update -> descendant attachment uses committed setup", async () => {
    const committed = vi.fn();
    const speculative = vi.fn();
    const pending = new Promise<void>(() => {});
    function Suspender(): React.ReactNode { throw pending; }
    function Target({ targetRef }: { targetRef: (node: HTMLDivElement | null) => void }) {
      const [key, setKey] = useState("first");
      return <>
        <button onClick={() => setKey("second")}>Replace target</button>
        <div key={key} ref={targetRef} />
      </>;
    }
    function Owner({ setup, suspend = false }: {
      setup: (node: HTMLDivElement) => void;
      suspend?: boolean;
    }) {
      const ref = useRefEffect(setup, []);
      return <><Target targetRef={ref} />{suspend ? <Suspender /> : null}</>;
    }
    const { rerender, getByRole } = render(
      <Suspense fallback="Waiting"><Owner setup={committed} /></Suspense>,
    );
    await act(async () => {
      startTransition(() => rerender(
        <Suspense fallback="Waiting"><Owner setup={speculative} suspend /></Suspense>,
      ));
    });

    fireEvent.click(getByRole("button", { name: "Replace target" }));

    expect(committed).toHaveBeenCalledTimes(2);
    expect(speculative).not.toHaveBeenCalled();
  });

  it("useRefEffect: equal dependencies and new setup -> retains the ref without restarting", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { result, rerender } = renderHook(
      ({ setup, dependency }) => useRefEffect<HTMLDivElement>(setup, [dependency]),
      { initialProps: { setup: first, dependency: NaN } },
    );
    const ref = result.current;

    rerender({ setup: latest, dependency: NaN });

    expect(result.current).toBe(ref);
    expect(first).not.toHaveBeenCalled();
    expect(latest).not.toHaveBeenCalled();
    rerender({ setup: latest, dependency: 0 });
    const zeroRef = result.current;
    rerender({ setup: latest, dependency: -0 });
    expect(result.current).not.toBe(zeroRef);
  });

  it("useRefEffect: stable mounted rerender -> preserves the active setup until unmount", () => {
    const cleanup = vi.fn();
    const first = vi.fn(() => cleanup);
    const latest = vi.fn();
    const { rerender, unmount } = render(<Probe setup={first} />);

    rerender(<Probe setup={latest} />);

    expect(first).toHaveBeenCalledTimes(1);
    expect(latest).not.toHaveBeenCalled();
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("useRefEffect: target attaches late -> runs only the latest setup after attachment", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender, getByTestId } = render(<Probe setup={first} target={null} />);

    rerender(<Probe setup={latest} />);

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith(getByTestId("target"));
  });

  it("useRefEffect: changed dependencies -> cleans the old setup before restarting on the same node", () => {
    const calls: string[] = [];
    const first = vi.fn(() => {
      calls.push("first setup");
      return () => { calls.push("first cleanup"); };
    });
    const latest = vi.fn(() => {
      calls.push("latest setup");
      return () => { calls.push("latest cleanup"); };
    });
    const { rerender, getByTestId, unmount } = render(<Probe setup={first} />);
    const node = getByTestId("target");

    rerender(<Probe setup={latest} dependency={1} />);

    expect(calls).toEqual(["first setup", "first cleanup", "latest setup"]);
    expect(latest).toHaveBeenCalledExactlyOnceWith(node);
    unmount();
    expect(calls).toEqual(["first setup", "first cleanup", "latest setup", "latest cleanup"]);
  });

  it("useRefEffect: target swaps with unchanged dependencies -> cleans old ownership and uses latest setup", () => {
    const cleanup = vi.fn();
    const first = vi.fn(() => cleanup);
    const latestCleanup = vi.fn();
    const latest = vi.fn(() => latestCleanup);
    const { rerender, getByTestId, unmount } = render(<Probe setup={first} />);

    rerender(<Probe setup={latest} target="replacement" />);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(latest).toHaveBeenCalledExactlyOnceWith(getByTestId("replacement"));
    expect(latestCleanup).not.toHaveBeenCalled();
    unmount();
    expect(latestCleanup).toHaveBeenCalledTimes(1);
  });

  it("useRefEffect: detach then reattach -> cleans once and starts a fresh setup", () => {
    const cleanup = vi.fn();
    const setup = vi.fn(() => cleanup);
    const { rerender, unmount } = render(<Probe setup={setup} />);

    rerender(<Probe setup={setup} target={null} />);

    expect(cleanup).toHaveBeenCalledTimes(1);
    rerender(<Probe setup={setup} />);
    expect(setup).toHaveBeenCalledTimes(2);
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it("useRefEffect: direct swap and repeated notifications -> returns void and cleans each attachment once", () => {
    const cleanups = [vi.fn(), vi.fn()];
    const setup = vi.fn()
      .mockReturnValueOnce(cleanups[0])
      .mockReturnValueOnce(cleanups[1]);
    const { result } = renderHook(() => useRefEffect<HTMLDivElement>(setup, []));
    const first = document.createElement("div");
    const second = document.createElement("div");

    expect(result.current(first)).toBeUndefined();
    result.current(first);
    expect(result.current(second)).toBeUndefined();
    result.current(null);
    result.current(null);

    expect(setup.mock.calls).toEqual([[first], [second]]);
    expect(cleanups[0]).toHaveBeenCalledTimes(1);
    expect(cleanups[1]).toHaveBeenCalledTimes(1);
  });

  it("useRefEffect: setup without cleanup -> accepts detach and dependency changes", () => {
    const setup = vi.fn();
    const { rerender, unmount } = render(<Probe setup={setup} />);

    rerender(<Probe setup={setup} dependency={1} />);
    unmount();

    expect(setup).toHaveBeenCalledTimes(2);
  });

  it("useRefEffect: StrictMode lifecycle -> keeps one active resource and balances all cleanups", () => {
    const cleanups: Array<ReturnType<typeof vi.fn>> = [];
    const setup = vi.fn(() => {
      const cleanup = vi.fn();
      cleanups.push(cleanup);
      return cleanup;
    });
    const { rerender, unmount } = render(<StrictMode><Probe setup={setup} /></StrictMode>);
    const cleanupCount = () => cleanups.reduce((count, cleanup) => count + cleanup.mock.calls.length, 0);
    expect(setup.mock.calls.length - cleanupCount()).toBe(1);

    rerender(<StrictMode><Probe setup={setup} dependency={1} /></StrictMode>);

    expect(setup.mock.calls.length - cleanupCount()).toBe(1);
    unmount();
    expect(cleanupCount()).toBe(setup.mock.calls.length);
    expect(cleanups.every((cleanup) => cleanup.mock.calls.length === 1)).toBe(true);
  });

  it("useRefEffect: server rendering -> never runs setup before attachment", () => {
    const setup = vi.fn();

    const html = renderToString(<Probe setup={setup} />);

    expect(html).toContain('data-testid="target"');
    expect(setup).not.toHaveBeenCalled();
  });
});

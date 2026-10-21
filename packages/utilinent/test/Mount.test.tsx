import { StrictMode, createRef, useCallback, useState, type ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Mount } from "../src/index";

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

async function settle(settlement: () => void) {
  await act(async () => {
    settlement();
    await Promise.resolve();
  });
}

describe("Mount async contract", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a direct React node immediately", () => {
    render(<Mount fallback="loading">ready</Mount>);

    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(screen.queryByText("loading")).not.toBeInTheDocument();
  });

  it("replaces the initial fallback with a synchronous factory result", () => {
    const factory = vi.fn(() => <p>sync result</p>);

    render(<Mount fallback="loading">{factory}</Mount>);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(screen.getByText("sync result")).toBeInTheDocument();
    expect(screen.queryByText("loading")).not.toBeInTheDocument();
  });

  it("shows fallback until an async factory fulfills", async () => {
    const deferred = createDeferred<ReactNode>();
    render(<Mount fallback="loading">{() => deferred.promise}</Mount>);

    expect(screen.getByText("loading")).toBeInTheDocument();

    await settle(() => deferred.resolve(<p>async result</p>));

    expect(screen.getByText("async result")).toBeInTheDocument();
  });

  it("keeps fallback and reports a synchronous factory throw once", () => {
    const failure = new Error("sync failure");
    const onError = vi.fn();
    const factory = vi.fn((): ReactNode => {
      throw failure;
    });

    render(
      <Mount fallback="failed" onError={onError}>
        {factory}
      </Mount>,
    );

    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(failure);
  });

  it("keeps fallback and reports an active rejection once", async () => {
    const deferred = createDeferred<ReactNode>();
    const failure = new Error("async failure");
    const onError = vi.fn();
    render(
      <Mount fallback="failed" onError={onError}>
        {() => deferred.promise}
      </Mount>,
    );

    await settle(() => deferred.reject(failure));

    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(failure);
  });

  it("ignores stale fulfillment after a newer async child resolves", async () => {
    const stale = createDeferred<ReactNode>();
    const current = createDeferred<ReactNode>();
    const rendered = render(<Mount fallback="loading">{() => stale.promise}</Mount>);

    rendered.rerender(<Mount fallback="loading">{() => current.promise}</Mount>);
    await settle(() => current.resolve("current result"));
    await settle(() => stale.resolve("stale result"));

    expect(screen.getByText("current result")).toBeInTheDocument();
    expect(screen.queryByText("stale result")).not.toBeInTheDocument();
  });

  it("ignores stale rejection after children are replaced", async () => {
    const deferred = createDeferred<ReactNode>();
    const onError = vi.fn();
    const rendered = render(
      <Mount fallback="loading" onError={onError}>
        {() => deferred.promise}
      </Mount>,
    );

    rendered.rerender(<Mount onError={onError}>replacement</Mount>);
    await settle(() => deferred.reject(new Error("stale failure")));

    expect(screen.getByText("replacement")).toBeInTheDocument();
    expect(onError).not.toHaveBeenCalled();
  });

  it("ignores fulfillment and rejection after unmount", async () => {
    const fulfillment = createDeferred<ReactNode>();
    const rejection = createDeferred<ReactNode>();
    const onError = vi.fn();
    const rendered = render(
      <>
        <Mount onError={onError}>{() => fulfillment.promise}</Mount>
        <Mount onError={onError}>{() => rejection.promise}</Mount>
      </>,
    );

    rendered.unmount();
    await settle(() => fulfillment.resolve("late result"));
    await settle(() => rejection.reject(new Error("late failure")));

    expect(onError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("replaces pending async work with a synchronous child", async () => {
    const deferred = createDeferred<ReactNode>();
    const rendered = render(<Mount fallback="loading">{() => deferred.promise}</Mount>);

    rendered.rerender(<Mount>sync replacement</Mount>);
    await settle(() => deferred.resolve("stale result"));

    expect(screen.getByText("sync replacement")).toBeInTheDocument();
    expect(screen.queryByText("stale result")).not.toBeInTheDocument();
  });

  it("accepts only the latest StrictMode factory settlement", async () => {
    const attempts: Array<ReturnType<typeof createDeferred<ReactNode>>> = [];
    const factory = vi.fn(() => {
      const attempt = createDeferred<ReactNode>();
      attempts.push(attempt);
      return attempt.promise;
    });
    render(
      <StrictMode>
        <Mount fallback="loading">{factory}</Mount>
      </StrictMode>,
    );
    const [stale, current] = attempts;
    if (!stale || !current) {
      throw new Error("Expected StrictMode to invoke the factory twice");
    }

    await settle(() => stale.resolve("stale result"));
    expect(screen.getByText("loading")).toBeInTheDocument();

    await settle(() => current.resolve("current result"));
    expect(screen.getByText("current result")).toBeInTheDocument();
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe("Mount proxy contract", () => {
  it("renders Mount.div content and forwards common host props and its ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Mount.div
        ref={ref}
        className="preview"
        data-state="ready"
        aria-label="Preview"
        data-testid="mount-div"
      >
        content
      </Mount.div>,
    );

    const element = screen.getByTestId("mount-div");
    expect(element.tagName).toBe("DIV");
    expect(element).toHaveTextContent("content");
    expect(element).toHaveClass("preview");
    expect(element).toHaveAttribute("data-state", "ready");
    expect(element).toHaveAccessibleName("Preview");
    expect(ref.current).toBe(element);
  });

  it("forwards element-specific props and a concrete DOM ref", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Mount.button ref={ref} type="submit">
        Submit
      </Mount.button>,
    );

    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button).toHaveAttribute("type", "submit");
    expect(ref.current).toBe(button);
  });
});

describe("Mount abort contract", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes exactly one live AbortSignal to the factory", () => {
    const factory = vi.fn((_signal: AbortSignal) => "sync result");

    render(<Mount>{factory}</Mount>);

    expect(factory).toHaveBeenCalledWith(expect.any(AbortSignal));
    const [signal] = factory.mock.calls[0]!;
    expect(signal.aborted).toBe(false);
  });

  it("aborts the replaced factory attempt and hands a live signal to the newer factory", async () => {
    const stale = createDeferred<ReactNode>();
    const current = createDeferred<ReactNode>();
    const signals: AbortSignal[] = [];
    const staleFactory = (signal: AbortSignal) => {
      signals.push(signal);
      return stale.promise;
    };
    const currentFactory = (signal: AbortSignal) => {
      signals.push(signal);
      return current.promise;
    };
    const rendered = render(<Mount fallback="loading">{staleFactory}</Mount>);

    rendered.rerender(<Mount fallback="loading">{currentFactory}</Mount>);

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);

    await settle(() => stale.resolve("stale result"));
    await settle(() => current.resolve("current result"));

    expect(screen.getByText("current result")).toBeInTheDocument();
    expect(screen.queryByText("stale result")).not.toBeInTheDocument();
  });

  it("aborts the pending factory attempt when unmounted without error noise", async () => {
    const deferred = createDeferred<ReactNode>();
    let observedSignal: AbortSignal | undefined;
    const onError = vi.fn();
    const rendered = render(
      <Mount fallback="loading" onError={onError}>
        {(signal: AbortSignal) => {
          observedSignal = signal;
          return deferred.promise;
        }}
      </Mount>,
    );

    rendered.unmount();

    expect(observedSignal?.aborted).toBe(true);
    await settle(() => deferred.reject(new Error("late failure")));

    expect(onError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("aborts the discarded StrictMode factory attempt", () => {
    const signals: AbortSignal[] = [];
    const factory = (signal: AbortSignal) => {
      signals.push(signal);
      return Promise.resolve<ReactNode>("result");
    };

    render(
      <StrictMode>
        <Mount fallback="loading">{factory}</Mount>
      </StrictMode>,
    );

    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it("forwards the abort event to a signal-aware factory and stays silent", async () => {
    const onError = vi.fn();
    const factory = (signal: AbortSignal) =>
      new Promise<ReactNode>((_, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(new DOMException("The operation was aborted.", "AbortError")),
          { once: true },
        );
      });
    const rendered = render(
      <Mount fallback="loading" onError={onError}>
        {factory}
      </Mount>,
    );

    rendered.unmount();
    await settle(() => undefined);

    expect(onError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("treats an AbortError rejection from the current attempt as a normal failure", async () => {
    const onError = vi.fn();

    render(
      <Mount fallback="failed" onError={onError}>
        {() => Promise.reject(new DOMException("The operation was aborted.", "AbortError"))}
      </Mount>,
    );
    await settle(() => undefined);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByText("failed")).toBeInTheDocument();
  });
});

describe("Mount identity contract", () => {
  it("does not restart a useCallback factory across unrelated parent re-renders", () => {
    const loads: string[] = [];
    function StableFactoryParent({ id }: { id: string }) {
      const [ticks, setTicks] = useState(0);
      const load = useCallback(() => {
        loads.push(id);
        return `result:${id}`;
      }, [id]);
      return (
        <div>
          <Mount fallback="loading">{load}</Mount>
          <button type="button" onClick={() => setTicks((count) => count + 1)}>
            rerender {ticks}
          </button>
        </div>
      );
    }
    const rendered = render(<StableFactoryParent id="a" />);

    fireEvent.click(screen.getByRole("button", { name: /rerender/ }));
    fireEvent.click(screen.getByRole("button", { name: /rerender/ }));

    expect(loads).toEqual(["a"]);
    expect(screen.getByText("result:a")).toBeInTheDocument();

    rendered.rerender(<StableFactoryParent id="b" />);

    expect(loads).toEqual(["a", "b"]);
    expect(screen.getByText("result:b")).toBeInTheDocument();
  });

  it("restarts the current factory when onError identity changes", () => {
    const loads: number[] = [];
    const load = () => {
      loads.push(loads.length);
      return `result:${loads.length}`;
    };
    const firstOnError = () => undefined;
    const secondOnError = () => undefined;
    const rendered = render(
      <Mount fallback="loading" onError={firstOnError}>
        {load}
      </Mount>,
    );

    rendered.rerender(
      <Mount fallback="loading" onError={secondOnError}>
        {load}
      </Mount>,
    );

    expect(loads).toEqual([0, 1]);
  });
});

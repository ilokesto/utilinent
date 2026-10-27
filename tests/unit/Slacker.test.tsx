import { StrictMode, useCallback, useState, type ComponentProps } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { For, Slacker } from "../../src/index";
import {
  enterViewport,
  installControlledIntersectionObserver,
} from "../fixtures/controlledIntersectionObserver";

async function advanceTimer(milliseconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

type StringSlackerProps = Omit<ComponentProps<typeof Slacker<string>>, "children">;

function stringSlacker(props: StringSlackerProps) {
  return <Slacker {...props}>{(value) => <p>{value}</p>}</Slacker>;
}

const PAGE_SIZE = 25;

function PagedProductList({ items }: { items: Array<{ id: number }> }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleItems = items.slice(0, visibleCount);
  return (
    <div>
      <For.ul each={visibleItems}>
        {(item) => <li data-item-id={item.id}>item {item.id}</li>}
      </For.ul>
      {visibleCount < items.length ? (
        <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
          Load more
        </button>
      ) : null}
    </div>
  );
}

describe("Slacker retry lifecycle", () => {
  beforeEach(() => {
    installControlledIntersectionObserver();
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts exactly one initial attempt after intersection in StrictMode", async () => {
    const loader = vi.fn<() => Promise<string>>().mockResolvedValue("loaded");

    render(
      <StrictMode>
        {stringSlacker({ loader })}
      </StrictMode>,
    );
    expect(loader).not.toHaveBeenCalled();

    await enterViewport();

    expect(loader).toHaveBeenCalledTimes(1);
    expect(screen.getByText("loaded")).toBeInTheDocument();
  });

  it("defers a zero-delay retry until the timer boundary", async () => {
    const loader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("first failure"))
      .mockResolvedValue("loaded");

    render(stringSlacker({ loader, maxRetries: 1, retryDelay: 0 }));
    await enterViewport();

    expect(loader).toHaveBeenCalledTimes(1);

    await advanceTimer(0);
    expect(loader).toHaveBeenCalledTimes(2);
    expect(screen.getByText("loaded")).toBeInTheDocument();
  });

  it("waits for the complete retry delay", async () => {
    const loader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("first failure"))
      .mockResolvedValue("loaded");

    render(stringSlacker({ loader, maxRetries: 1, retryDelay: 1000 }));
    await enterViewport();

    await advanceTimer(999);
    expect(loader).toHaveBeenCalledTimes(1);

    await advanceTimer(1);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("does not retry when maxRetries is zero", async () => {
    const onError = vi.fn();
    const loader = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("failure"));

    render(stringSlacker({ loader, maxRetries: 0, onError }));
    await enterViewport();
    await advanceTimer(5000);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("stops after the configured additional attempts", async () => {
    const onError = vi.fn();
    const loader = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("failure"));

    render(stringSlacker({ loader, maxRetries: 2, retryDelay: 100, onError }));
    await enterViewport();
    await advanceTimer(100);
    await advanceTimer(100);
    await advanceTimer(1000);

    expect(loader).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledTimes(3);
  });

  it("cancels the automatic retry when a manual retry succeeds", async () => {
    const retryCallbacks: Array<() => void> = [];
    const loader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("failure"))
      .mockResolvedValue("loaded");

    const rendered = render(
      stringSlacker({
        loader,
        maxRetries: 1,
        retryDelay: 1000,
        errorFallback: ({ retry }) => {
          retryCallbacks.push(retry);
          return <button onClick={retry}>Retry</button>;
        },
      }),
    );
    await enterViewport();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await act(async () => Promise.resolve());
    await advanceTimer(1000);

    expect(loader).toHaveBeenCalledTimes(2);
    expect(screen.getByText("loaded")).toBeInTheDocument();

    rendered.rerender(stringSlacker({ loader, maxRetries: 2, retryDelay: 1000 }));
    const staleRetry = retryCallbacks[0];
    if (!staleRetry) {
      throw new Error("Expected the error fallback retry callback");
    }
    act(() => staleRetry());
    await act(async () => Promise.resolve());
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("coalesces rapid manual retries with the in-flight attempt", async () => {
    const retryAttempt = createDeferred<string>();
    const loader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("failure"))
      .mockImplementation(() => retryAttempt.promise);

    render(
      stringSlacker({
        loader,
        maxRetries: 2,
        retryDelay: 1000,
        errorFallback: ({ retry }) => <button onClick={retry}>Retry</button>,
      }),
    );
    await enterViewport();
    const retryButton = screen.getByRole("button", { name: "Retry" });

    act(() => {
      retryButton.click();
      retryButton.click();
      retryButton.click();
    });
    await act(async () => Promise.resolve());

    expect(loader).toHaveBeenCalledTimes(2);
    retryAttempt.resolve("loaded");
    await act(async () => Promise.resolve());
    await advanceTimer(1000);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("invalidates pending timers and settlements when the loader is replaced", async () => {
    const oldAttempt = createDeferred<string>();
    const oldLoader = vi.fn(() => oldAttempt.promise);
    const middleLoader = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("failure"));
    const newLoader = vi.fn<() => Promise<string>>().mockResolvedValue("new data");
    const rendered = render(
      stringSlacker({ loader: oldLoader, maxRetries: 1, retryDelay: 1000 }),
    );
    await enterViewport();

    rendered.rerender(
      stringSlacker({ loader: middleLoader, maxRetries: 1, retryDelay: 1000 }),
    );
    await act(async () => Promise.resolve());
    oldAttempt.resolve("old data");
    await act(async () => Promise.resolve());

    rendered.rerender(
      stringSlacker({ loader: newLoader, maxRetries: 1, retryDelay: 1000 }),
    );
    await act(async () => Promise.resolve());
    await advanceTimer(1000);

    expect(oldLoader).toHaveBeenCalledTimes(1);
    expect(middleLoader).toHaveBeenCalledTimes(1);
    expect(newLoader).toHaveBeenCalledTimes(1);
    expect(screen.getByText("new data")).toBeInTheDocument();
    expect(screen.queryByText("old data")).not.toBeInTheDocument();
  });

  it("invalidates manual retry callbacks when the loader is replaced", async () => {
    const retryCallbacks: Array<() => void> = [];
    const errorFallback = ({ retry }: { retry: () => void }) => {
      retryCallbacks.push(retry);
      return <button onClick={retry}>Retry</button>;
    };
    const oldLoader = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("old failure"));
    const newLoader = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("new failure"));
    const rendered = render(stringSlacker({ loader: oldLoader, maxRetries: 1, errorFallback }));
    await enterViewport();
    const staleRetry = retryCallbacks[0];

    rendered.rerender(stringSlacker({ loader: newLoader, maxRetries: 1, errorFallback }));
    await act(async () => Promise.resolve());
    if (!staleRetry) {
      throw new Error("Expected the original retry callback");
    }
    act(() => staleRetry());
    await act(async () => Promise.resolve());

    expect(oldLoader).toHaveBeenCalledTimes(1);
    expect(newLoader).toHaveBeenCalledTimes(1);
  });

  it("cancels a scheduled retry when unmounted", async () => {
    const loader = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("failure"));
    const rendered = render(stringSlacker({ loader, maxRetries: 1, retryDelay: 1000 }));
    await enterViewport();

    rendered.unmount();
    await advanceTimer(1000);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("ignores a failed settlement after unmount", async () => {
    const pendingAttempt = createDeferred<string>();
    const onError = vi.fn();
    const loader = vi.fn(() => pendingAttempt.promise);
    const rendered = render(stringSlacker({ loader, maxRetries: 1, onError }));
    await enterViewport();

    rendered.unmount();
    pendingAttempt.reject(new Error("late failure"));
    await act(async () => Promise.resolve());
    await advanceTimer(1000);

    expect(onError).not.toHaveBeenCalled();
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

describe("Slacker abort contract", () => {
  beforeEach(() => {
    installControlledIntersectionObserver();
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("passes exactly one live AbortSignal to the loader", async () => {
    const signals: AbortSignal[] = [];
    const loader = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return Promise.resolve("loaded");
    });

    render(stringSlacker({ loader }));
    await enterViewport();

    expect(loader).toHaveBeenCalledTimes(1);
    expect(signals[0]).toBeInstanceOf(AbortSignal);
    expect(signals[0]?.aborted).toBe(false);
  });

  it("aborts the replaced loader attempt and hands a live signal to the new loader", async () => {
    const oldAttempt = createDeferred<string>();
    const signals: AbortSignal[] = [];
    const oldLoader = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return oldAttempt.promise;
    });
    const newLoader = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return Promise.resolve("new data");
    });
    const rendered = render(stringSlacker({ loader: oldLoader }));
    await enterViewport();

    rendered.rerender(stringSlacker({ loader: newLoader }));
    await act(async () => Promise.resolve());

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    expect(screen.getByText("new data")).toBeInTheDocument();
  });

  it("aborts a pending signal-aware loader on unmount without retries or error noise", async () => {
    const onError = vi.fn();
    const loader = vi.fn((signal: AbortSignal) =>
      new Promise<string>((_, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(new DOMException("The operation was aborted.", "AbortError")),
          { once: true },
        );
      }),
    );
    const rendered = render(stringSlacker({ loader, maxRetries: 2, retryDelay: 100, onError }));
    await enterViewport();

    rendered.unmount();
    await act(async () => Promise.resolve());
    await advanceTimer(1000);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("gives every retry attempt a fresh non-aborted signal", async () => {
    const signals: AbortSignal[] = [];
    const loader = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return Promise.reject(new Error("failure"));
    });

    render(stringSlacker({ loader, maxRetries: 1, retryDelay: 100 }));
    await enterViewport();
    await advanceTimer(100);

    expect(loader).toHaveBeenCalledTimes(2);
    expect(signals).toHaveLength(2);
    expect(signals[0]).not.toBe(signals[1]);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it("counts an AbortError from the active attempt against the retry budget", async () => {
    const loader = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockRejectedValueOnce(new DOMException("The operation was aborted.", "AbortError"))
      .mockResolvedValue("loaded");

    render(stringSlacker({ loader, maxRetries: 1, retryDelay: 0 }));
    await enterViewport();
    await advanceTimer(0);

    expect(loader).toHaveBeenCalledTimes(2);
    expect(screen.getByText("loaded")).toBeInTheDocument();
  });
});

describe("Slacker identity contract", () => {
  beforeEach(() => {
    installControlledIntersectionObserver();
  });

  it("does not restart a useCallback loader across unrelated parent re-renders", async () => {
    const loads: string[] = [];
    function StableLoaderParent({ id }: { id: string }) {
      const [ticks, setTicks] = useState(0);
      const loader = useCallback(() => {
        loads.push(id);
        return Promise.resolve(`data:${id}`);
      }, [id]);
      return (
        <div>
          <Slacker loader={loader}>
            {(value) => <p>{value}</p>}
          </Slacker>
          <button type="button" onClick={() => setTicks((count) => count + 1)}>
            rerender {ticks}
          </button>
        </div>
      );
    }
    const rendered = render(<StableLoaderParent id="a" />);
    await enterViewport();

    fireEvent.click(screen.getByRole("button", { name: /rerender/ }));
    fireEvent.click(screen.getByRole("button", { name: /rerender/ }));
    expect(loads).toEqual(["a"]);

    rendered.rerender(<StableLoaderParent id="b" />);
    await act(async () => Promise.resolve());

    expect(loads).toEqual(["a", "b"]);
    expect(screen.getByText("data:b")).toBeInTheDocument();
  });
});

describe("Slacker large-list contract", () => {
  beforeEach(() => {
    installControlledIntersectionObserver();
  });

  it("lazy-loading guide example: mounts only the current page of a large list", async () => {
    const items = Array.from({ length: 500 }, (_, index) => ({ id: index }));
    const loader = vi.fn(() => Promise.resolve(items));

    render(
      <Slacker loader={loader} loadingFallback={<p>loading</p>}>
        {(loaded) => <PagedProductList items={loaded} />}
      </Slacker>,
    );

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    await enterViewport();

    const list = screen.getByRole("list");
    expect(list.children).toHaveLength(PAGE_SIZE);
    expect(screen.getAllByRole("listitem")).toHaveLength(PAGE_SIZE);

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    const renderedIds = screen
      .getAllByRole("listitem")
      .map((item) => item.dataset.itemId);
    expect(renderedIds).toHaveLength(PAGE_SIZE * 2);
    expect(new Set(renderedIds).size).toBe(PAGE_SIZE * 2);
  });
});

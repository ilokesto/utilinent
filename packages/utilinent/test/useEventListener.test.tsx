import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEventListener } from "../src/hooks";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEventListener", () => {
  it("useEventListener: refTargetMountedAfterInitialRender -> eventDeliveredExactlyOnce", () => {
    // Arrange
    const handler = vi.fn();
    function Probe({ show }: { show: boolean }) {
      const ref = useRef<HTMLDivElement>(null);
      useEventListener(ref, "ping", handler);
      return show ? <div ref={ref} data-testid="target" /> : null;
    }
    const { rerender, getByTestId } = render(<Probe show={false} />);

    // Act
    rerender(<Probe show={true} />);
    act(() => {
      getByTestId("target").dispatchEvent(new Event("ping"));
    });

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("useEventListener: refTargetPresentAtFirstRender -> eventDelivered", () => {
    // Arrange
    const handler = vi.fn();
    function Probe() {
      const ref = useRef<HTMLDivElement>(null);
      useEventListener(ref, "ping", handler);
      return <div ref={ref} data-testid="target" />;
    }
    const { getByTestId } = render(<Probe />);

    // Act
    act(() => {
      getByTestId("target").dispatchEvent(new Event("ping"));
    });

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("useEventListener: refTargetSwappedThroughSameRef -> onlyNewTargetResponds", () => {
    // Arrange
    const handler = vi.fn();
    function Probe({ first }: { first: boolean }) {
      const ref = useRef<HTMLDivElement>(null);
      useEventListener(ref, "ping", handler);
      return first ? (
        <div key="a" ref={ref} data-testid="a" />
      ) : (
        <div key="b" ref={ref} data-testid="b" />
      );
    }
    const { rerender, getByTestId } = render(<Probe first={true} />);
    const firstTarget = getByTestId("a");
    act(() => {
      firstTarget.dispatchEvent(new Event("ping"));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    // Act
    rerender(<Probe first={false} />);
    const secondTarget = getByTestId("b");
    act(() => {
      firstTarget.dispatchEvent(new Event("ping"));
    });

    // Assert: the swapped-out node no longer invokes the handler.
    expect(handler).toHaveBeenCalledTimes(1);

    act(() => {
      secondTarget.dispatchEvent(new Event("ping"));
    });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("useEventListener: refTargetClearedToNull -> listenerRemovedFromPreviousNode", () => {
    // Arrange
    const handler = vi.fn();
    function Probe({ show }: { show: boolean }) {
      const ref = useRef<HTMLDivElement>(null);
      useEventListener(ref, "ping", handler);
      return show ? <div ref={ref} data-testid="target" /> : null;
    }
    const { rerender, getByTestId } = render(<Probe show={true} />);
    const target = getByTestId("target");

    // Act
    rerender(<Probe show={false} />);
    act(() => {
      target.dispatchEvent(new Event("ping"));
    });

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it("useEventListener: handlerOnlyRerender -> latestHandlerInvokedWithoutRebinding", () => {
    // Arrange
    const firstHandler = vi.fn();
    const latestHandler = vi.fn();
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    function Probe({ handler }: { handler: (event: Event) => void }) {
      useEventListener(window, "resize", handler);
      return null;
    }
    const { rerender } = render(<Probe handler={firstHandler} />);

    // Act
    rerender(<Probe handler={latestHandler} />);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    // Assert
    expect(firstHandler).not.toHaveBeenCalled();
    expect(latestHandler).toHaveBeenCalledTimes(1);
    expect(addListener.mock.calls.filter(([type]) => type === "resize")).toHaveLength(1);
    expect(removeListener.mock.calls.filter(([type]) => type === "resize")).toHaveLength(0);
  });

  it("useEventListener: disabledToggledThenUnmounted -> noInvocationAfterTeardown", () => {
    // Arrange
    const handler = vi.fn();
    function Probe({ disabled }: { disabled: boolean }) {
      useEventListener(window, "resize", handler, { disabled });
      return null;
    }
    const { rerender, unmount } = render(<Probe disabled={false} />);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    // Act
    rerender(<Probe disabled={true} />);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    rerender(<Probe disabled={false} />);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(handler).toHaveBeenCalledTimes(2);

    unmount();
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    // Assert
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("useEventListener: captureOptionChanged -> handlerFollowsRequestedPhase", () => {
    // Arrange
    const handler = vi.fn();
    function Probe({ capture }: { capture: boolean }) {
      const parentRef = useRef<HTMLDivElement>(null);
      useEventListener(parentRef, "ping", handler, { capture });
      return (
        <div ref={parentRef} data-testid="parent">
          <button data-testid="child" />
        </div>
      );
    }
    const { rerender, getByTestId } = render(<Probe capture={true} />);
    const child = getByTestId("child");

    // Act: non-bubbling events still traverse the capture phase, so a capture
    // listener on the parent fires while a bubble listener never does.
    act(() => {
      child.dispatchEvent(new Event("ping"));
    });

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);

    rerender(<Probe capture={false} />);
    act(() => {
      child.dispatchEvent(new Event("ping"));
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

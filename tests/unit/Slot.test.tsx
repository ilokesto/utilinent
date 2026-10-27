import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Slot, Slottable } from "../../src/index";

function refWithCleanup<T>(cleanup: () => void) {
  return (node: T | null) => (node ? cleanup : undefined);
}

function spySlotWarning() {
  return vi.spyOn(console, "warn").mockImplementation(() => {});
}

describe("Slot children contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Slot: single element child -> merges className and style onto the child", () => {
    // Arrange
    const { container } = render(
      <Slot className="slot" style={{ margin: "4px" }}>
        <button className="child" style={{ color: "red" }} type="button">
          go
        </button>
      </Slot>,
    );
    const button = container.querySelector("button");

    // Act & Assert
    expect(button).toHaveClass("child", "slot");
    expect(button).toHaveStyle({ color: "rgb(255, 0, 0)", margin: "4px" });
  });

  it("Slot: child and slot handlers -> child handler runs before slot handler", () => {
    // Arrange
    const childHandler = vi.fn();
    const slotHandler = vi.fn();
    render(
      <Slot onClick={slotHandler}>
        <button onClick={childHandler} type="button">
          go
        </button>
      </Slot>,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "go" }));

    // Assert
    expect(childHandler).toHaveBeenCalledTimes(1);
    expect(slotHandler).toHaveBeenCalledTimes(1);
    expect(childHandler.mock.invocationCallOrder[0]).toBeLessThan(
      slotHandler.mock.invocationCallOrder[0],
    );
  });

  it("Slot: multiple element children -> merges into the first child and warns in development", () => {
    // Arrange
    const warn = spySlotWarning();

    // Act
    const { container } = render(
      <Slot className="slot">
        <button type="button">first</button>
        <span>second</span>
      </Slot>,
    );

    // Assert
    expect(container.querySelector("button")).toHaveClass("slot");
    expect(container.querySelector("span")).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("Slot: text child -> renders nothing and warns in development", () => {
    // Arrange
    const warn = spySlotWarning();

    // Act
    const { container } = render(<Slot className="slot">plain text</Slot>);

    // Assert
    expect(container.innerHTML).toBe("");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("Slot: falsy children -> renders null without warning", () => {
    // Arrange
    const warn = spySlotWarning();

    // Act
    const { container } = render(<Slot className="slot">{false}</Slot>);

    // Assert
    expect(container.innerHTML).toBe("");
    expect(warn).not.toHaveBeenCalled();
  });

  it("Slottable: valid element child -> merged props land on the slotted child only", () => {
    // Arrange & Act
    const { container } = render(
      <Slot className="trigger">
        <span>prefix</span>
        <Slottable>
          <a href="/docs">Docs</a>
        </Slottable>
      </Slot>,
    );

    // Assert
    expect(container.querySelector("a")).toHaveClass("trigger");
    expect(container.querySelector("span")?.textContent).toBe("prefix");
  });

  it("Slottable: non-element child -> renders siblings without the slot and warns in development", () => {
    // Arrange
    const warn = spySlotWarning();

    // Act
    const { container } = render(
      <Slot className="trigger">
        <span>prefix</span>
        <Slottable>plain text</Slottable>
      </Slot>,
    );

    // Assert
    expect(container.querySelector("span")?.textContent).toBe("prefix");
    expect(container.querySelector("a")).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("Slot composed ref stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Slot: identical forwarded and child refs across rerenders -> each ref attaches once", () => {
    // Arrange
    const forwardedRef = vi.fn();
    const childRef = vi.fn();
    const rendered = render(
      <Slot ref={forwardedRef}>
        <button ref={childRef} type="button">
          go
        </button>
      </Slot>,
    );

    // Act
    rendered.rerender(
      <Slot ref={forwardedRef}>
        <button ref={childRef} type="button">
          go
        </button>
      </Slot>,
    );

    // Assert
    expect(forwardedRef).toHaveBeenCalledTimes(1);
    expect(childRef).toHaveBeenCalledTimes(1);
  });

  it("Slot: forwarded ref identity changes -> previous ref detaches once and the new ref attaches once", () => {
    // Arrange
    const previousRef = vi.fn();
    const nextRef = vi.fn();
    const rendered = render(
      <Slot ref={previousRef}>
        <button type="button">go</button>
      </Slot>,
    );
    const button = rendered.container.querySelector("button");

    // Act
    rendered.rerender(
      <Slot ref={nextRef}>
        <button type="button">go</button>
      </Slot>,
    );

    // Assert
    expect(previousRef).toHaveBeenCalledTimes(2);
    expect(previousRef).toHaveBeenNthCalledWith(1, button);
    expect(previousRef).toHaveBeenLastCalledWith(null);
    expect(nextRef).toHaveBeenCalledTimes(1);
    expect(nextRef).toHaveBeenCalledWith(button);
  });

  it("Slot: child ref identity changes -> previous child ref detaches exactly once", () => {
    // Arrange
    const previousChildRef = vi.fn();
    const nextChildRef = vi.fn();
    const rendered = render(
      <Slot>
        <button ref={previousChildRef} type="button">
          go
        </button>
      </Slot>,
    );

    // Act
    rendered.rerender(
      <Slot>
        <button ref={nextChildRef} type="button">
          go
        </button>
      </Slot>,
    );

    // Assert (React 19 pads direct detach calls with extra args; check the node arg)
    expect(previousChildRef).toHaveBeenCalledTimes(2);
    expect(previousChildRef.mock.calls[1]?.[0]).toBeNull();
    expect(nextChildRef).toHaveBeenCalledTimes(1);
  });

  it("Slot: cleanup ref with stable inputs -> cleanup runs only on unmount", () => {
    // Arrange
    const cleanup = vi.fn();
    const cleanupRef = refWithCleanup<HTMLElement>(cleanup);
    const rendered = render(
      <Slot ref={cleanupRef}>
        <button type="button">go</button>
      </Slot>,
    );

    // Act
    rendered.rerender(
      <Slot ref={cleanupRef}>
        <button type="button">go</button>
      </Slot>,
    );

    // Assert
    expect(cleanup).not.toHaveBeenCalled();

    rendered.unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("Slot: object ref composed with a cleanup callback -> assignment and clear run once across stable rerenders", () => {
    // Arrange
    const objectRef = createRef<HTMLElement>();
    const cleanup = vi.fn();
    const childCleanupRef = refWithCleanup<HTMLButtonElement>(cleanup);
    const rendered = render(
      <Slot ref={objectRef}>
        <button ref={childCleanupRef} type="button">
          go
        </button>
      </Slot>,
    );
    const button = rendered.container.querySelector("button");

    // Act
    rendered.rerender(
      <Slot ref={objectRef}>
        <button ref={childCleanupRef} type="button">
          go
        </button>
      </Slot>,
    );

    // Assert
    expect(objectRef.current).toBe(button);
    expect(cleanup).not.toHaveBeenCalled();

    rendered.unmount();

    expect(objectRef.current).toBeNull();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("Slot: rerender switching between plain and Slottable children -> ref transfers with exact detach and attach", () => {
    // Arrange
    const forwardedRef = vi.fn();
    const rendered = render(
      <Slot ref={forwardedRef}>
        <button type="button">go</button>
      </Slot>,
    );

    // Act
    rendered.rerender(
      <Slot ref={forwardedRef}>
        <span>prefix</span>
        <Slottable>
          <a href="/docs">Docs</a>
        </Slottable>
      </Slot>,
    );
    rendered.rerender(
      <Slot ref={forwardedRef}>
        <button type="button">go</button>
      </Slot>,
    );

    // Assert (the host element changes button -> anchor -> button, so the
    // forwarded ref transfers with exactly one detach and one attach per swap)
    expect(forwardedRef).toHaveBeenCalledTimes(5);
    expect(forwardedRef.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
    expect(forwardedRef.mock.calls[1][0]).toBeNull();
    expect(forwardedRef.mock.calls[2][0]).toBeInstanceOf(HTMLAnchorElement);
    expect(forwardedRef.mock.calls[3][0]).toBeNull();
    expect(forwardedRef.mock.calls[4][0]).toBeInstanceOf(HTMLButtonElement);
    expect(screen.getByRole("button", { name: "go" })).toBeTruthy();
  });

  it("Slottable: identical refs across rerenders -> composed ref attaches once and siblings stay rendered", () => {
    // Arrange
    const forwardedRef = vi.fn();
    const rendered = render(
      <Slot ref={forwardedRef}>
        <span>prefix</span>
        <Slottable>
          <a href="/docs">Docs</a>
        </Slottable>
      </Slot>,
    );

    // Act
    rendered.rerender(
      <Slot ref={forwardedRef}>
        <span>prefix</span>
        <Slottable>
          <a href="/docs">Docs</a>
        </Slottable>
      </Slot>,
    );

    // Assert
    expect(forwardedRef).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Docs" })).toBeTruthy();
    expect(screen.getByText("prefix")).toBeTruthy();
  });

  it("Slottable: cleanup ref with stable inputs and rerenders -> cleanup runs exactly once on unmount", () => {
    // Arrange
    const cleanup = vi.fn();
    const cleanupRef = refWithCleanup<HTMLElement>(cleanup);
    const rendered = render(
      <Slot ref={cleanupRef}>
        <span>prefix</span>
        <Slottable>
          <a href="/docs">Docs</a>
        </Slottable>
      </Slot>,
    );

    // Act
    rendered.rerender(
      <Slot ref={cleanupRef}>
        <span>prefix</span>
        <Slottable>
          <a href="/docs">Docs</a>
        </Slottable>
      </Slot>,
    );
    rendered.unmount();

    // Assert
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

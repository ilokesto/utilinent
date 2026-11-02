import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, forwardRef, startTransition, StrictMode, Suspense } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LongPress, PluginManager } from "../../src";

// React 18's jsdom does not implement PointerEvent. Preserve real DOM dispatch
// and MouseEvent coordinates while supplying the pointer-specific fields.
function pointer(
  target: Node | Window,
  type: string,
  options: MouseEventInit & { pointerId?: number; pointerType?: string; isPrimary?: boolean } = {},
) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...options });
  Object.defineProperties(event, {
    pointerId: { value: options.pointerId ?? 1 },
    pointerType: { value: options.pointerType ?? "mouse" },
    isPrimary: { value: options.isPrimary ?? true },
  });
  fireEvent(target, event);
  return event;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  PluginManager.unregister("longPress", "SwappingTarget");
});

it("LongPress: suspended callback update -> active gestures use the last committed callback", async () => {
  const committed = vi.fn();
  const speculative = vi.fn();
  const pending = new Promise<void>(() => {});
  function Suspender(): React.ReactNode { throw pending; }
  function Example({ callback, suspend = false }: { callback: () => void; suspend?: boolean }) {
    return <>
      <LongPress onLongPress={callback}>Hold</LongPress>
      {suspend ? <Suspender /> : null}
    </>;
  }
  const { rerender } = render(
    <Suspense fallback="Waiting"><Example callback={committed} /></Suspense>,
  );
  pointer(screen.getByRole("button"), "pointerdown");
  await act(async () => {
    startTransition(() => rerender(
      <Suspense fallback="Waiting"><Example callback={speculative} suspend /></Suspense>,
    ));
  });

  act(() => vi.advanceTimersByTime(500));

  expect(committed).toHaveBeenCalledTimes(1);
  expect(speculative).not.toHaveBeenCalled();
});

it.each(["mouse", "touch", "pen"])(
  "LongPress: continuous %s press -> activates once and suppresses its click",
  (pointerType) => {
    const onLongPress = vi.fn();
    const onLongPressEnd = vi.fn();
    const onClick = vi.fn();
    render(<LongPress onLongPress={onLongPress} onLongPressEnd={onLongPressEnd} onClick={onClick}>Hold</LongPress>);
    const button = screen.getByRole("button");
    const start = pointer(button, "pointerdown", { pointerType });
    act(() => vi.advanceTimersByTime(499));
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    pointer(button, "pointerup", { pointerType });
    fireEvent.click(button, { detail: 1 });

    expect(onLongPress).toHaveBeenCalledExactlyOnceWith(start);
    expect(onLongPressEnd).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  },
);

it("LongPress: short press -> invokes regular click immediately without long callbacks", () => {
  const onLongPress = vi.fn();
  const onLongPressEnd = vi.fn();
  const onClick = vi.fn();
  render(<LongPress onLongPress={onLongPress} onLongPressEnd={onLongPressEnd} onClick={onClick}>Tap</LongPress>);
  const button = screen.getByRole("button");
  pointer(button, "pointerdown");
  act(() => vi.advanceTimersByTime(100));
  pointer(button, "pointerup");

  fireEvent.click(button, { detail: 1 });

  expect(onClick).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(1000));
  expect(onLongPress).not.toHaveBeenCalled();
  expect(onLongPressEnd).not.toHaveBeenCalled();
});

it("LongPress: keyboard activation after long press -> remains immediate without consuming pointer suppression", () => {
  const onClick = vi.fn();
  render(<LongPress onClick={onClick}>Hold</LongPress>);
  const button = screen.getByRole("button");
  pointer(button, "pointerdown");
  act(() => vi.advanceTimersByTime(500));
  pointer(button, "pointerup");

  fireEvent.click(button, { detail: 0 });

  expect(onClick).toHaveBeenCalledTimes(1);
  fireEvent.click(button, { detail: 1 });
  expect(onClick).toHaveBeenCalledTimes(1);
});

it.each(["pointerup", "pointercancel"])(
  "LongPress: %s outside before activation -> cancels the pending timer",
  (type) => {
    const onLongPress = vi.fn();
    const onLongPressEnd = vi.fn();
    render(<LongPress onLongPress={onLongPress} onLongPressEnd={onLongPressEnd}>Hold</LongPress>);
    pointer(screen.getByRole("button"), "pointerdown");

    pointer(document.body, type);
    act(() => vi.advanceTimersByTime(500));

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onLongPressEnd).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  },
);

it.each(["pointerup", "pointercancel", "pointermove"])(
  "LongPress: %s outside after activation -> ends exactly once",
  (type) => {
    const onLongPressEnd = vi.fn();
    render(<LongPress onLongPressEnd={onLongPressEnd}>Hold</LongPress>);
    pointer(screen.getByRole("button"), "pointerdown");
    act(() => vi.advanceTimersByTime(500));

    pointer(document.body, type, { clientX: 11 });
    pointer(document.body, "pointerup");

    expect(onLongPressEnd).toHaveBeenCalledTimes(1);
  },
);

it("LongPress: movement above the configured Euclidean threshold -> cancels activation", () => {
  const onLongPress = vi.fn();
  render(<LongPress movementThreshold={5} onLongPress={onLongPress}>Hold</LongPress>);
  pointer(screen.getByRole("button"), "pointerdown", { clientX: 10, clientY: 10 });

  pointer(document.body, "pointermove", { clientX: 14, clientY: 14 });
  act(() => vi.advanceTimersByTime(500));

  expect(onLongPress).not.toHaveBeenCalled();
});

it("LongPress: movement at threshold and unrelated pointer events -> preserves the active gesture", () => {
  const onLongPress = vi.fn();
  render(<LongPress movementThreshold={5} duration={200} onLongPress={onLongPress}>Hold</LongPress>);
  pointer(screen.getByRole("button"), "pointerdown");
  pointer(document.body, "pointermove", { clientX: 3, clientY: 4 });
  pointer(document.body, "pointermove", { pointerId: 2, clientX: 100 });
  pointer(document.body, "pointerup", { pointerId: 2 });
  pointer(document.body, "pointercancel", { pointerId: 2 });

  act(() => vi.advanceTimersByTime(200));

  expect(onLongPress).toHaveBeenCalledTimes(1);
});

it.each([false, true])(
  "LongPress: disabled while activated=%s -> cancels the gesture and blocks clicks",
  (activated) => {
    const onLongPress = vi.fn();
    const onLongPressEnd = vi.fn();
    const onClick = vi.fn();
    const { rerender } = render(<LongPress.div onLongPress={onLongPress} onLongPressEnd={onLongPressEnd} onClick={onClick} data-testid="target" />);
    const node = screen.getByTestId("target");
    pointer(node, "pointerdown");
    if (activated) {
      act(() => vi.advanceTimersByTime(500));
    }

    rerender(<LongPress.div disabled onLongPress={onLongPress} onLongPressEnd={onLongPressEnd} onClick={onClick} data-testid="target" />);
    fireEvent.click(node, { detail: 0 });
    pointer(node, "pointerdown");
    act(() => vi.advanceTimersByTime(500));

    expect(onLongPress).toHaveBeenCalledTimes(activated ? 1 : 0);
    expect(onLongPressEnd).toHaveBeenCalledTimes(activated ? 1 : 0);
    expect(onClick).not.toHaveBeenCalled();
    expect(node).toHaveAttribute("aria-disabled", "true");
    expect(node).not.toHaveAttribute("disabled");
  },
);

it.each([false, true])(
  "LongPress: unmount while activated=%s -> removes listeners and ends only activated gestures",
  (activated) => {
    const onLongPress = vi.fn();
    const onLongPressEnd = vi.fn();
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<StrictMode><LongPress onLongPress={onLongPress} onLongPressEnd={onLongPressEnd}>Hold</LongPress></StrictMode>);
    pointer(screen.getByRole("button"), "pointerdown");
    if (activated) {
      act(() => vi.advanceTimersByTime(500));
    }
    const subscriptions = add.mock.calls.filter(([type]) => ["pointermove", "pointerup", "pointercancel"].includes(type));

    unmount();
    pointer(document.body, "pointerup");
    act(() => vi.advanceTimersByTime(1000));

    expect(onLongPress).toHaveBeenCalledTimes(activated ? 1 : 0);
    expect(onLongPressEnd).toHaveBeenCalledTimes(activated ? 1 : 0);
    expect(vi.getTimerCount()).toBe(0);
    for (const [type, listener, capture] of subscriptions) {
      expect(remove).toHaveBeenCalledWith(type, listener, capture);
    }
  },
);

it("LongPress: latest callbacks while pending -> uses updated callbacks without restarting the timer", () => {
  const first = vi.fn();
  const latest = vi.fn();
  const end = vi.fn();
  const { rerender } = render(<LongPress onLongPress={first}>Hold</LongPress>);
  const button = screen.getByRole("button");
  pointer(button, "pointerdown");
  act(() => vi.advanceTimersByTime(400));
  rerender(<LongPress onLongPress={latest} onLongPressEnd={end}>Hold</LongPress>);

  act(() => vi.advanceTimersByTime(100));
  pointer(button, "pointerup");

  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledTimes(1);
  expect(end).toHaveBeenCalledTimes(1);
});

it("LongPress: native props and pointer handlers -> preserves handlers and typed refs without leaking options", () => {
  const ref = createRef<HTMLAnchorElement>();
  const down = vi.fn();
  const up = vi.fn();
  const move = vi.fn();
  const cancel = vi.fn();
  render(<LongPress.a href="/item" ref={ref} duration={300} movementThreshold={20}
    onPointerDown={down} onPointerUp={up} onPointerMove={move} onPointerCancel={cancel}>Item</LongPress.a>);
  const link = screen.getByRole("link");

  pointer(link, "pointerdown");
  pointer(link, "pointermove");
  pointer(link, "pointerup");
  pointer(link, "pointercancel");

  expect(ref.current).toBe(link);
  expect(link).toHaveAttribute("href", "/item");
  expect(link).not.toHaveAttribute("duration");
  expect(link).not.toHaveAttribute("movementThreshold");
  for (const handler of [down, up, move, cancel]) {
    expect(handler).toHaveBeenCalledTimes(1);
  }
});

it.each([{ button: 2 }, { isPrimary: false }])(
  "LongPress: non-primary input %j -> does not start a gesture",
  (options) => {
    const onLongPress = vi.fn();
    render(<LongPress onLongPress={onLongPress}>Hold</LongPress>);

    pointer(screen.getByRole("button"), "pointerdown", options);
    act(() => vi.advanceTimersByTime(500));

    expect(onLongPress).not.toHaveBeenCalled();
  },
);

it("LongPress: prevented pointerdown -> preserves the caller's cancellation", () => {
  const onLongPress = vi.fn();
  render(<LongPress onLongPress={onLongPress} onPointerDown={(event) => event.preventDefault()}>Hold</LongPress>);

  pointer(screen.getByRole("button"), "pointerdown");
  act(() => vi.advanceTimersByTime(500));

  expect(onLongPress).not.toHaveBeenCalled();
});

it("LongPress: new short gesture after suppressed click -> invokes regular click again", () => {
  const onClick = vi.fn();
  render(<LongPress onClick={onClick}>Hold</LongPress>);
  const button = screen.getByRole("button");
  pointer(button, "pointerdown");
  act(() => vi.advanceTimersByTime(500));
  pointer(button, "pointerup");
  fireEvent.click(button, { detail: 1 });

  pointer(button, "pointerdown");
  pointer(button, "pointerup");
  fireEvent.click(button, { detail: 1 });

  expect(onClick).toHaveBeenCalledTimes(1);
});

it("LongPress: completed long press inside a clickable ancestor -> prevents duplicate bubbling and native activation", () => {
  const ancestorClick = vi.fn();
  render(<div onClick={ancestorClick}><LongPress.a href="/item">Hold</LongPress.a></div>);
  const link = screen.getByRole("link");
  pointer(link, "pointerdown");
  act(() => vi.advanceTimersByTime(500));
  pointer(link, "pointerup");
  const click = new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 });

  fireEvent(link, click);

  expect(click.defaultPrevented).toBe(true);
  expect(ancestorClick).not.toHaveBeenCalled();
});

it("LongPress: target in another document -> listens and ends in that owner document", () => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const ownerDocument = frame.contentDocument;
  if (!ownerDocument) {
    throw new Error("The iframe must have an owner document.");
  }
  const onLongPressEnd = vi.fn();
  const { getByRole, unmount } = render(<LongPress onLongPressEnd={onLongPressEnd}>Hold</LongPress>, {
    container: ownerDocument.body,
    baseElement: ownerDocument.body,
  });
  pointer(getByRole("button"), "pointerdown");
  act(() => vi.advanceTimersByTime(500));

  pointer(ownerDocument.body, "pointerup");

  expect(onLongPressEnd).toHaveBeenCalledTimes(1);
  unmount();
  frame.remove();
});

const SwappingTarget = forwardRef<HTMLElement, { asLink?: boolean; children?: React.ReactNode }>(
  function SwappingTarget({ asLink, ...props }, ref) {
    return asLink
      ? <a {...props} href="/item" ref={ref as React.Ref<HTMLAnchorElement>} />
      : <button {...props} ref={ref as React.Ref<HTMLButtonElement>} />;
  },
);

declare module "../../src/types/register" {
  interface UtilinentRegister {
    longPress: { SwappingTarget: typeof SwappingTarget };
  }
}

it.each([false, true])(
  "LongPress: registered target swaps nodes while activated=%s -> cancels the old gesture and forwards the new ref",
  (activated) => {
    PluginManager.register({ longPress: { SwappingTarget } });
    const ref = createRef<HTMLElement>();
    const onLongPress = vi.fn();
    const onLongPressEnd = vi.fn();
    const { rerender } = render(<LongPress.SwappingTarget ref={ref} onLongPress={onLongPress} onLongPressEnd={onLongPressEnd}>Item</LongPress.SwappingTarget>);
    pointer(screen.getByRole("button"), "pointerdown");
    if (activated) {
      act(() => vi.advanceTimersByTime(500));
    }

    rerender(<LongPress.SwappingTarget asLink ref={ref} onLongPress={onLongPress} onLongPressEnd={onLongPressEnd}>Item</LongPress.SwappingTarget>);
    act(() => vi.advanceTimersByTime(500));

    expect(ref.current).toBe(screen.getByRole("link"));
    expect(onLongPress).toHaveBeenCalledTimes(activated ? 1 : 0);
    expect(onLongPressEnd).toHaveBeenCalledTimes(activated ? 1 : 0);
    pointer(screen.getByRole("link"), "pointerdown");
    act(() => vi.advanceTimersByTime(500));
    expect(onLongPress).toHaveBeenCalledTimes(activated ? 2 : 1);
  },
);

it("LongPress: default button and explicit native type -> defaults safely and preserves caller overrides", () => {
  const ref = createRef<HTMLButtonElement>();
  const { rerender } = render(<LongPress ref={ref}>Hold</LongPress>);
  expect(ref.current).toBe(screen.getByRole("button"));
  expect(ref.current).toHaveAttribute("type", "button");

  rerender(<LongPress ref={ref} type="submit" disabled>Hold</LongPress>);

  expect(ref.current).toHaveAttribute("type", "submit");
  expect(ref.current).toBeDisabled();
});

it("LongPress: server rendering -> renders content without starting a timer", () => {
  const onLongPress = vi.fn();

  const html = renderToString(<LongPress duration={100} onLongPress={onLongPress}>Hold</LongPress>);

  expect(html).toContain("Hold");
  expect(html).not.toContain("duration");
  expect(vi.getTimerCount()).toBe(0);
  expect(onLongPress).not.toHaveBeenCalled();
});

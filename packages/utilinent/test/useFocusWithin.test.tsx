import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFocusWithin } from "../src/hooks";

interface ProbeProps {
  target?: string | null;
}

function Probe({ target = "target" }: ProbeProps) {
  const { ref, isFocusWithin } = useFocusWithin();
  return (
    <>
      {target !== null && (
        <div key={target} ref={ref} data-testid={target} tabIndex={-1}>
          <button>First</button>
          <button>Second</button>
        </div>
      )}
      <button>Outside</button>
      <output>{String(isFocusWithin)}</output>
    </>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("useFocusWithin", () => {
  it("useFocusWithin: programmatic descendant focus -> reports focus within", () => {
    const { getByRole } = render(<Probe />);
    expect(getByRole("status")).toHaveTextContent("false");

    act(() => getByRole("button", { name: "First" }).focus());

    expect(getByRole("status")).toHaveTextContent("true");
  });

  it("useFocusWithin: target itself receives focus -> reports focus within", () => {
    const { getByRole, getByTestId } = render(<Probe />);

    act(() => getByTestId("target").focus());

    expect(getByRole("status")).toHaveTextContent("true");
  });

  it("useFocusWithin: relatedTarget is another child -> never reports an exit", () => {
    const { getByRole } = render(<Probe />);
    const first = getByRole("button", { name: "First" });
    const second = getByRole("button", { name: "Second" });
    act(() => first.focus());

    // Flush focusout separately so a later focusin cannot hide a false state.
    fireEvent.focusOut(first, { relatedTarget: second });

    expect(getByRole("status")).toHaveTextContent("true");
    act(() => second.focus());
    expect(getByRole("status")).toHaveTextContent("true");
  });

  it("useFocusWithin: focus moves outside -> reports a true exit", () => {
    const { getByRole } = render(<Probe />);
    act(() => getByRole("button", { name: "First" }).focus());

    act(() => getByRole("button", { name: "Outside" }).focus());

    expect(getByRole("status")).toHaveTextContent("false");
  });

  it("useFocusWithin: blur has no relatedTarget -> clears focus", () => {
    const { getByRole } = render(<Probe />);
    const first = getByRole("button", { name: "First" });
    act(() => first.focus());

    act(() => first.blur());

    expect(getByRole("status")).toHaveTextContent("false");
  });

  it("useFocusWithin: non-Node relatedTarget -> clears focus without throwing", () => {
    const { getByRole } = render(<Probe />);
    const first = getByRole("button", { name: "First" });
    act(() => first.focus());

    fireEvent.focusOut(first, { relatedTarget: new window.EventTarget() });

    expect(getByRole("status")).toHaveTextContent("false");
  });

  it("useFocusWithin: target attaches late -> begins observing focus", () => {
    const { getByRole, rerender } = render(<Probe target={null} />);

    rerender(<Probe />);
    act(() => getByRole("button", { name: "First" }).focus());

    expect(getByRole("status")).toHaveTextContent("true");
  });

  it("useFocusWithin: target swaps -> resets state and removes old listeners", () => {
    const { getByRole, getByTestId, rerender } = render(<Probe />);
    const oldTarget = getByTestId("target");
    const remove = vi.spyOn(oldTarget, "removeEventListener");
    act(() => getByRole("button", { name: "First" }).focus());

    rerender(<Probe target="replacement" />);
    fireEvent.focusIn(oldTarget);

    expect(getByRole("status")).toHaveTextContent("false");
    expect(remove.mock.calls.map(([type]) => type)).toEqual(["focusin", "focusout"]);
    act(() => getByRole("button", { name: "Second" }).focus());
    expect(getByRole("status")).toHaveTextContent("true");
  });

  it("useFocusWithin: target clears to null -> resets state and removes listeners", () => {
    const { getByRole, getByTestId, rerender } = render(<Probe />);
    const oldTarget = getByTestId("target");
    const remove = vi.spyOn(oldTarget, "removeEventListener");
    act(() => getByRole("button", { name: "First" }).focus());

    rerender(<Probe target={null} />);
    fireEvent.focusIn(oldTarget);

    expect(getByRole("status")).toHaveTextContent("false");
    expect(remove.mock.calls.map(([type]) => type)).toEqual(["focusin", "focusout"]);
  });

  it("useFocusWithin: attaches around an already-focused child -> synchronizes state", () => {
    function AttachmentProbe({ attached }: { attached: boolean }) {
      const { ref, isFocusWithin } = useFocusWithin();
      return (
        <div ref={attached ? ref : null}>
          <button>Existing child</button>
          <output>{String(isFocusWithin)}</output>
        </div>
      );
    }
    const { getByRole, rerender } = render(<AttachmentProbe attached={false} />);
    act(() => getByRole("button").focus());

    rerender(<AttachmentProbe attached={true} />);

    expect(getByRole("status")).toHaveTextContent("true");
  });

  it("useFocusWithin: repeated internal movement and rerender -> no state or listener churn", () => {
    const { result, rerender } = renderHook(useFocusWithin);
    const target = document.createElement("div");
    const first = document.createElement("button");
    const second = document.createElement("button");
    target.append(first, second);
    document.body.appendChild(target);
    const add = vi.spyOn(target, "addEventListener");
    const remove = vi.spyOn(target, "removeEventListener");
    const ref = result.current.ref;
    act(() => ref(target));
    act(() => first.focus());
    const focusedResult = result.current;

    act(() => second.focus());

    expect(result.current).toBe(focusedResult);
    rerender();
    expect(result.current.ref).toBe(ref);
    expect(add).toHaveBeenCalledTimes(2);
    expect(remove).not.toHaveBeenCalled();
    act(() => ref(null));
    target.remove();
  });

  it("useFocusWithin: StrictMode mount and unmount -> each listener is removed exactly once", () => {
    const add = vi.spyOn(HTMLElement.prototype, "addEventListener");
    const remove = vi.spyOn(HTMLElement.prototype, "removeEventListener");
    const { getByTestId, getByRole, unmount } = render(<StrictMode><Probe /></StrictMode>);
    const target = getByTestId("target");
    act(() => getByRole("button", { name: "First" }).focus());
    expect(getByRole("status")).toHaveTextContent("true");
    const registrations = add.mock.calls.filter((_, index) => add.mock.contexts[index] === target);
    const removals = () => remove.mock.calls.filter((_, index) => remove.mock.contexts[index] === target);
    expect(registrations.length - removals().length).toBe(2);

    unmount();

    expect(removals()).toHaveLength(registrations.length);
    for (const [type, listener] of registrations) {
      expect(removals().filter(([removedType, removedListener]) =>
        removedType === type && removedListener === listener,
      )).toHaveLength(1);
    }
  });

  it("useFocusWithin: focused server markup hydrates -> starts false then syncs without mismatch", async () => {
    const renders: boolean[] = [];
    function HydrationProbe() {
      const { ref, isFocusWithin } = useFocusWithin();
      renders.push(isFocusWithin);
      return <div ref={ref}><button>Child</button><output>{String(isFocusWithin)}</output></div>;
    }
    const container = document.createElement("div");
    container.innerHTML = renderToString(<HydrationProbe />);
    expect(renders).toEqual([false]);
    document.body.appendChild(container);
    container.querySelector("button")?.focus();
    renders.length = 0;
    const recoverableErrors = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;

    try {
      await act(async () => {
        root = hydrateRoot(container, <HydrationProbe />, { onRecoverableError: recoverableErrors });
      });

      expect(renders[0]).toBe(false);
      expect(container.querySelector("output")).toHaveTextContent("true");
      expect(recoverableErrors).not.toHaveBeenCalled();
    } finally {
      act(() => root?.unmount());
      container.remove();
    }
  });
});

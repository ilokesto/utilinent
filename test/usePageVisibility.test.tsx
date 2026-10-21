import { act, cleanup, render, renderHook } from "@testing-library/react";
import { Fragment, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePageVisibility } from "../src/hooks";

describe("usePageVisibility", () => {
  let visibility: DocumentVisibilityState;
  let originalVisibility: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalVisibility = Object.getOwnPropertyDescriptor(document, "visibilityState");
    visibility = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibility,
    });
  });

  afterEach(() => {
    cleanup();
    if (originalVisibility) {
      Object.defineProperty(document, "visibilityState", originalVisibility);
    } else {
      Reflect.deleteProperty(document, "visibilityState");
    }
    vi.restoreAllMocks();
  });

  it.each(["visible", "hidden"] as const)(
    "usePageVisibility: client mounts while %s -> reads current document state",
    (initialVisibility) => {
      visibility = initialVisibility;

      const { result } = renderHook(usePageVisibility);

      expect(result.current).toBe(initialVisibility === "visible");
    },
  );

  it.each([
    ["visible", "hidden"],
    ["hidden", "visible"],
  ] as const)(
    "usePageVisibility: %s changes to %s -> updates from the document event",
    (initialVisibility, nextVisibility) => {
      visibility = initialVisibility;
      const { result } = renderHook(usePageVisibility);

      act(() => {
        visibility = nextVisibility;
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current).toBe(nextVisibility === "visible");
    },
  );

  it("usePageVisibility: unrelated rerender -> retains one listener and current state", () => {
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    function Probe({ label }: { label: string }) {
      const isVisible = usePageVisibility();
      return <output>{label}:{String(isVisible)}</output>;
    }
    const { rerender, getByRole } = render(<Probe label="first" />);
    act(() => {
      visibility = "hidden";
      document.dispatchEvent(new Event("visibilitychange"));
    });

    rerender(<Probe label="second" />);

    expect(getByRole("status").textContent).toBe("second:false");
    expect(addListener.mock.calls.filter(([type]) => type === "visibilitychange")).toHaveLength(1);
    expect(removeListener.mock.calls.filter(([type]) => type === "visibilitychange")).toHaveLength(0);
  });

  it.each([false, true])(
    "usePageVisibility: unmount with StrictMode=%s -> removes every owned listener",
    (strict) => {
      const addListener = vi.spyOn(document, "addEventListener");
      const removeListener = vi.spyOn(document, "removeEventListener");
      const wrapper = strict ? StrictMode : Fragment;
      const { unmount } = renderHook(usePageVisibility, { wrapper });
      const added = addListener.mock.calls
        .filter(([type]) => type === "visibilitychange")
        .map(([, listener]) => listener);
      const removedBeforeUnmount = removeListener.mock.calls
        .filter(([type]) => type === "visibilitychange");
      expect(added).toHaveLength(strict ? 2 : 1);
      expect(removedBeforeUnmount).toHaveLength(strict ? 1 : 0);

      unmount();

      const removed = removeListener.mock.calls
        .filter(([type]) => type === "visibilitychange")
        .map(([, listener]) => listener);
      expect(removed).toEqual(added);
    },
  );

  it("usePageVisibility: server without document -> renders the paused snapshot", () => {
    function Probe() {
      return <output>{String(usePageVisibility())}</output>;
    }
    vi.stubGlobal("document", undefined);

    try {
      const html = renderToString(<Probe />);

      expect(html).toBe("<output>false</output>");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each(["visible", "hidden"] as const)(
    "usePageVisibility: hydration into a %s document -> matches server then reads actual visibility",
    async (clientVisibility) => {
      const snapshots: boolean[] = [];
      function Probe() {
        const isVisible = usePageVisibility();
        snapshots.push(isVisible);
        return <output>{String(isVisible)}</output>;
      }
      const html = renderToString(<Probe />);
      expect(snapshots).toEqual([false]);
      snapshots.length = 0;
      visibility = clientVisibility;
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);
      const recoverableErrors: unknown[] = [];
      let root: ReturnType<typeof hydrateRoot> | undefined;

      try {
        await act(async () => {
          root = hydrateRoot(container, <Probe />, {
            onRecoverableError: (error) => recoverableErrors.push(error),
          });
        });

        expect(snapshots[0]).toBe(false);
        expect(snapshots.at(-1)).toBe(clientVisibility === "visible");
        expect(container.textContent).toBe(String(clientVisibility === "visible"));
        expect(recoverableErrors).toEqual([]);
      } finally {
        act(() => root?.unmount());
        container.remove();
      }
    },
  );
});

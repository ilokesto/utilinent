import { act, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Media } from "../../src/components/Media";
import { useMediaQuery } from "../../src/hooks";

interface StubbedQueryList {
  matches: boolean;
  listeners: Set<(event: MediaQueryListEvent) => void>;
}

/**
 * Installs a deterministic `window.matchMedia` stub and returns control over
 * per-query match state and change events.
 */
function installMatchMediaStub() {
  const lists = new Map<string, StubbedQueryList>();

  function getList(query: string): StubbedQueryList {
    const existing = lists.get(query);
    if (existing) {
      return existing;
    }
    const created: StubbedQueryList = { matches: false, listeners: new Set() };
    lists.set(query, created);
    return created;
  }

  window.matchMedia = (query: string): MediaQueryList => {
    const list = getList(query);
    return {
      get matches() {
        return list.matches;
      },
      media: query,
      onchange: null,
      addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "change") {
          list.listeners.add(listener as (event: MediaQueryListEvent) => void);
        }
      },
      removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "change") {
          list.listeners.delete(listener as (event: MediaQueryListEvent) => void);
        }
      },
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    } satisfies MediaQueryList;
  };

  return {
    setMatch(query: string, matches: boolean) {
      getList(query).matches = matches;
    },
    emitChange(query: string, matches: boolean) {
      const list = lists.get(query);
      if (!list) {
        return;
      }
      const event = { matches, media: query } as MediaQueryListEvent;
      for (const listener of [...list.listeners]) {
        listener(event);
      }
    },
    activeListenerCount(query: string) {
      return lists.get(query)?.listeners.size ?? 0;
    },
  };
}

function MatchesProbe({ query }: { query: string }) {
  const matches = useMediaQuery(query);
  return <span>{matches ? "matches" : "fallback"}</span>;
}

function MediaProbe({ query }: { query: string }) {
  return (
    <Media query={query} fallback={<span>fallback</span>}>
      <span>matched</span>
    </Media>
  );
}

describe("useMediaQuery", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("useMediaQuery: serverHtmlHydratedWithDifferentClientMatch -> noRecoverableHydrationErrorThenSyncs", async () => {
    // Arrange: the server render has no matchMedia, so the server snapshot is
    // the non-matching branch; the client then hydrates with a matching query.
    Reflect.set(window, "matchMedia", undefined);
    const serverHtml = renderToString(<MatchesProbe query="(min-width: 768px)" />);
    expect(serverHtml).toContain("fallback");

    const control = installMatchMediaStub();
    control.setMatch("(min-width: 768px)", true);
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = serverHtml;
    const recoverableErrors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;

    // Act
    act(() => {
      root = hydrateRoot(container, <MatchesProbe query="(min-width: 768px)" />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(recoverableErrors).toHaveLength(0);
    expect(container.textContent).toBe("matches");

    act(() => root?.unmount());
    container.remove();
  });

  it("Media: serverHtmlHydratedWithMatchingQuery -> fallbackBranchHydratesThenSwitchesBeforePaint", async () => {
    // Arrange
    Reflect.set(window, "matchMedia", undefined);
    const serverHtml = renderToString(<MediaProbe query="(min-width: 768px)" />);
    expect(serverHtml).toContain("fallback");

    const control = installMatchMediaStub();
    control.setMatch("(min-width: 768px)", true);
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = serverHtml;
    const recoverableErrors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;

    // Act
    act(() => {
      root = hydrateRoot(container, <MediaProbe query="(min-width: 768px)" />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(recoverableErrors).toHaveLength(0);
    expect(container.textContent).toBe("matched");

    act(() => root?.unmount());
    container.remove();
  });

  it("useMediaQuery: queryReplaced -> onlyTheNewQueryListenerReceivesChanges", () => {
    // Arrange
    const control = installMatchMediaStub();
    let matches = false;
    function Probe({ query }: { query: string }) {
      matches = useMediaQuery(query);
      return null;
    }
    const { rerender } = render(<Probe query="(min-width: 768px)" />);

    // Act
    rerender(<Probe query="(max-width: 767px)" />);
    act(() => {
      control.emitChange("(min-width: 768px)", true);
    });

    // Assert
    expect(matches).toBe(false);

    act(() => {
      control.emitChange("(max-width: 767px)", true);
    });
    expect(matches).toBe(true);
  });

  it("useMediaQuery: matchMediaUnsupported -> staysFalseWithoutThrowing", () => {
    // Arrange
    Reflect.set(window, "matchMedia", undefined);
    let matches: boolean | undefined;
    function Probe() {
      matches = useMediaQuery("(min-width: 768px)");
      return null;
    }

    // Act
    render(<Probe />);

    // Assert
    expect(matches).toBe(false);
  });

  it("useMediaQuery: unmounted -> changeListenerRemoved", () => {
    // Arrange
    const control = installMatchMediaStub();
    function Probe() {
      const matches = useMediaQuery("(min-width: 768px)");
      return <span>{String(matches)}</span>;
    }
    const { unmount } = render(<Probe />);
    expect(control.activeListenerCount("(min-width: 768px)")).toBe(1);

    // Act
    unmount();

    // Assert
    expect(control.activeListenerCount("(min-width: 768px)")).toBe(0);
  });
});

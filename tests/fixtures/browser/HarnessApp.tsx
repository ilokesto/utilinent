import { StrictMode, useEffect, useRef, useState } from "react";
import { LoadMore } from "../../../src/components/LoadMore";
import type { LoadMoreState } from "../../../src/components/LoadMore";
import { DelayedFallback } from "../../../src/components/DelayedFallback";
import { useFocusWithin } from "../../../src/hooks/useFocusWithin";
import { usePageVisibility } from "../../../src/hooks/usePageVisibility";

export type Signal = { kind: string; value: unknown };

export function report(kind: string, value: unknown) {
  if (typeof window !== "undefined") {
    window.harness.signals.push({ kind, value });
    void window.reportSignal({ kind, value });
  }
}

function FocusExample() {
  const { ref, isFocusWithin } = useFocusWithin();
  useEffect(() => report("focus", isFocusWithin), [isFocusWithin]);
  return <section>
    <button id="before">Before group</button>
    <div id="focus-group" ref={ref}>
      <button id="first">First child</button>
      <button id="second">Second child</button>
    </div>
    <button id="after">After group</button>
    <output id="focus">{String(isFocusWithin)}</output>
  </section>;
}

function VisibilityExample() {
  const isVisible = usePageVisibility();
  useEffect(() => report("visibility", isVisible), [isVisible]);
  return <output id="visibility">{String(isVisible)}</output>;
}

function LoadState({ state, calls }: { state: LoadMoreState; calls: number }) {
  useEffect(() => report("load-state", {
    calls, loading: state.isLoading, intersecting: state.isIntersecting,
    error: state.error instanceof Error ? state.error.message : null,
  }), [calls, state.isLoading, state.isIntersecting, state.error]);
  return <div>
    <output id="calls">{calls}</output>
    <output id="loading">{String(state.isLoading)}</output>
    <output id="error">{state.error instanceof Error ? state.error.message : "none"}</output>
    <button id="retry" onClick={state.retry}>Retry page</button>
  </div>;
}

function InfiniteExample() {
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [calls, setCalls] = useState(0);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const pending = useRef<{ resolve: () => void; reject: () => void } | null>(null);
  const load = () => {
    setCalls(value => value + 1);
    setBusy(true);
    return new Promise<void>((resolve, reject) => {
      pending.current = {
        resolve: () => { setBusy(false); resolve(); },
        reject: () => { setBusy(false); reject(new Error("page failed")); },
      };
    });
  };
  useEffect(() => {
    window.harness.settle = async (failure = false) => {
      const task = pending.current;
      pending.current = null;
      if (failure) { task?.reject(); } else { task?.resolve(); }
      // The hook registered its settlement callback before this microtask.
      await Promise.resolve();
      report("settled", failure);
    };
  }, []);
  return <section>
    <button id="finish" onClick={() => void window.harness.settle()}>Complete page</button>
    <button id="fail" onClick={() => void window.harness.settle(true)}>Fail page</button>
    <button id="end" onClick={() => { setHasMore(false); void window.harness.settle(); }}>End pages</button>
    <div id="scroll-root" ref={setScrollRoot} style={{ height: 250, overflowY: "auto" }}>
      <div style={{ height: 900 }}>Scroll down to load pages</div>
      <LoadMore id="sentinel" root={scrollRoot} busy={busy} hasMore={hasMore}
        onLoadMore={load} onError={() => report("load-error", true)} style={{ minHeight: 60 }}>
        {state => <LoadState state={state} calls={calls} />}
      </LoadMore>
    </div>
  </section>;
}

function Indicator() {
  useEffect(() => {
    report("indicator", true);
    return () => report("indicator", false);
  }, []);
  return <span id="indicator">Loading results</span>;
}

function PendingExample() {
  const [pending, setPending] = useState(false);
  useEffect(() => report("pending", pending), [pending]);
  return <section>
    <button id="start" onClick={() => setPending(true)}>Start request</button>
    <button id="finish" onClick={() => setPending(false)}>Finish request</button>
    <DelayedFallback pending={pending} delay={500} minDuration={600} fallback={<Indicator />}>
      <span id="content">Results ready</span>
    </DelayedFallback>
  </section>;
}

export function HarnessApp({ route }: { route: string }) {
  return <StrictMode>
    <main>
      <h1>utilinent browser contracts</h1>
      {route === "/focus" ? <FocusExample /> :
        route === "/visibility" ? <VisibilityExample /> :
          route === "/pending" ? <PendingExample /> : <InfiniteExample />}
    </main>
  </StrictMode>;
}

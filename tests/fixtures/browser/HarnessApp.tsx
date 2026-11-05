import { StrictMode, useEffect, useRef, useState, type ReactNode } from "react";
import { LoadMore } from "../../../src/components/LoadMore";
import type { LoadMoreState } from "../../../src/components/LoadMore";
import { DelayedFallback } from "../../../src/components/DelayedFallback";
import { ErrorBoundary } from "../../../src/components/ErrorBoundary";
import { OptionalWrapper } from "../../../src/components/OptionalWrapper";
import { useFocusWithin } from "../../../src/hooks/useFocusWithin";
import { usePageVisibility } from "../../../src/hooks/usePageVisibility";
import { useIntersectionObserver } from "../../../src/hooks/useIntersectionObserver";
import { useDebounce } from "../../../src/hooks/useDebounce";
import { useThrottle } from "../../../src/hooks/useThrottle";

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

const timingValues = [
  function initialValue() { throw new Error("Initial function value executed"); },
  function secondValue() { throw new Error("Second function value executed"); },
  function latestValue() { throw new Error("Latest function value executed"); },
];

function CallableTimingExample() {
  const [index, setIndex] = useState(0);
  const value = timingValues[index];
  const debounced = useDebounce(value, 100);
  const throttled = useThrottle(value, 100);
  useEffect(() => report("value-state", {
    input: value.name, debounced: debounced.name, throttled: throttled.name,
  }), [value, debounced, throttled]);
  return <section>
    <button id="value-second" onClick={() => setIndex(1)}>Use second function</button>
    <button id="value-latest" onClick={() => setIndex(2)}>Use latest function</button>
    <p>Debounced: <output id="debounced-value">{debounced.name}</output></p>
    <p>Throttled: <output id="throttled-value">{throttled.name}</output></p>
  </section>;
}

function OptionalWrapperExample() {
  const [condition, setCondition] = useState<"empty" | "truthy" | "mixed">("empty");
  const [branch, setBranch] = useState<"else" | "fallback" | "plain">("else");
  const [clicks, setClicks] = useState(0);
  const childRef = useRef<HTMLButtonElement>(null);
  const enabled = condition === "truthy";
  const when = enabled ? [true, "ready"] : condition === "mixed" ? [true, 0] : [];
  useEffect(() => report("optional-state", {
    condition, branch, clicks, ref: childRef.current?.id ?? null,
  }), [condition, branch, clicks]);
  const wrapper = (children: ReactNode) => {
    if (!enabled) { throw new Error("Inactive wrapper executed"); }
    return <div id="optional-wrapper">{children}</div>;
  };
  const elseWrapper = (children: ReactNode) => {
    if (enabled || branch !== "else") { throw new Error("Inactive elseWrapper executed"); }
    return <div id="optional-else">{children}</div>;
  };
  const fallback = (children: ReactNode) => {
    if (enabled || branch !== "fallback") { throw new Error("Inactive fallback executed"); }
    return <article id="optional-fallback">{children}</article>;
  };
  return <section id="optional-host">
    <button id="optional-true" onClick={() => setCondition("truthy")}>Use truthy array</button>
    <button id="optional-mixed" onClick={() => setCondition("mixed")}>Use mixed array</button>
    <button id="optional-use-fallback" onClick={() => setBranch("fallback")}>Use fallback alias</button>
    <button id="optional-plain" onClick={() => setBranch("plain")}>Use plain children</button>
    <OptionalWrapper when={when} wrapper={wrapper}
      elseWrapper={branch === "else" ? elseWrapper : undefined}
      fallback={branch === "plain" ? undefined : fallback}>
      <button id="optional-child" ref={childRef} onClick={() => setClicks(value => value + 1)}>
        Child clicks: {clicks}
      </button>
    </OptionalWrapper>
  </section>;
}

function BoundaryContent({ fails }: { fails: boolean }) {
  useEffect(() => report("boundary-ready", true), []);
  if (fails) {
    throw new Error("expected boundary failure");
  }
  return <p id="boundary-content">Boundary content ready</p>;
}

function BoundaryExample() {
  const [key, setKey] = useState(1);
  const [extra, setExtra] = useState(false);
  const [fails, setFails] = useState(false);
  const [ticks, setTicks] = useState(0);
  useEffect(() => report("boundary-parent", { key, extra, fails, ticks }), [key, extra, fails, ticks]);
  return <section>
    <button id="boundary-fail" onClick={() => setFails(true)}>Fail content</button>
    <button id="boundary-same" onClick={() => setTicks(value => value + 1)}>Render equal keys</button>
    <button id="boundary-value" onClick={() => setKey(value => value + 1)}>Change key value</button>
    <button id="boundary-length" onClick={() => setExtra(true)}>Add reset key</button>
    <button id="boundary-repair" onClick={() => setFails(false)}>Repair content</button>
    <ErrorBoundary
      resetKeys={extra ? [key, "extra"] : [key]}
      onError={error => report("boundary-error", error.message)}
      fallback={({ reset }) => <p id="boundary-fallback">
        Content failed <button id="boundary-retry" onClick={reset}>Retry content</button>
      </p>}
    >
      <BoundaryContent fails={fails} />
    </ErrorBoundary>
  </section>;
}

function IntersectionExample() {
  const [which, setWhich] = useState("a");
  const { ref, isIntersecting, entry } = useIntersectionObserver({
    threshold: 0.5,
    freezeOnceVisible: true,
    onIntersect: (_visible, record) => report("intersection-enter", record.target.id),
  });
  useEffect(() => report("intersection-state", {
    which, visible: isIntersecting, entry: entry?.target.id ?? null,
  }), [which, isIntersecting, entry]);
  return <section>
    <button id="replace-target" onClick={() => setWhich("b")}>Replace observed target</button>
    <div key={which} id={`target-${which}`} ref={ref} style={{ minHeight: 80 }}>
      Observed target {which}
    </div>
    <output id="intersection-visible">{String(isIntersecting)}</output>
    <output id="intersection-entry">{entry?.target.id ?? "none"}</output>
  </section>;
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
          route === "/intersection" ? <IntersectionExample /> :
            route === "/boundary" ? <BoundaryExample /> :
              route === "/optional" ? <OptionalWrapperExample /> :
                route === "/callable-values" ? <CallableTimingExample /> :
                  route === "/pending" ? <PendingExample /> : <InfiniteExample />}
    </main>
  </StrictMode>;
}

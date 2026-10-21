import { useCallback } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIntersectionObserver } from "../src/hooks/useIntersectionObserver";
import { getIntersectionObserverPoolStatsForTests } from "../src/hooks/intersectionObserverPool";
import {
  emitIntersectionForTarget,
  hasActiveIntersectionObserver,
  installControlledIntersectionObserver,
  intersectionObserverMetrics,
} from "./controlledIntersectionObserver";

type IntersectionChangeHandler = (
  isIntersecting: boolean,
  entry: IntersectionObserverEntry,
) => void;

type ProbeProps = {
  readonly testId: string;
  readonly threshold?: number | number[];
  readonly rootMargin?: string;
  readonly root?: Element | null;
  readonly freezeOnceVisible?: boolean;
  readonly onIntersect?: IntersectionChangeHandler;
};

function Probe({
  testId,
  threshold,
  rootMargin,
  root,
  freezeOnceVisible,
  onIntersect,
}: ProbeProps) {
  const { ref } = useIntersectionObserver({
    threshold,
    rootMargin,
    root,
    freezeOnceVisible,
    onIntersect,
  });
  return <section ref={ref} data-testid={testId} />;
}

describe("IntersectionObserver pooling", () => {
  beforeEach(installControlledIntersectionObserver);

  it("pool: multiple targets with equal options -> share one native observer", () => {
    // Arrange
    render(
      <>
        <Probe testId="first" threshold={0.5} rootMargin="10px" />
        <Probe testId="second" threshold={[0.5]} rootMargin="10px" />
        <Probe testId="third" threshold={[0.5, 0.5]} rootMargin="10px" />
      </>,
    );

    // Act: construction happens per subscription; no records required.

    // Assert
    expect(intersectionObserverMetrics().created).toBe(1);
    expect(intersectionObserverMetrics().observing).toBe(3);
  });

  it("pool: distinct thresholds or rootMargin -> separate native observers", () => {
    // Arrange
    render(
      <>
        <Probe testId="first" threshold={0} />
        <Probe testId="second" threshold={0.5} />
        <Probe testId="third" threshold={0} rootMargin="20px" />
      </>,
    );

    // Act

    // Assert
    expect(intersectionObserverMetrics().created).toBe(3);
    expect(intersectionObserverMetrics().observing).toBe(3);
  });

  it("pool: distinct root elements -> separate native observers", () => {
    // Arrange
    const rootA = document.createElement("div");
    const rootB = document.createElement("div");

    // Act
    render(
      <>
        <Probe testId="first" root={rootA} />
        <Probe testId="second" root={rootB} />
      </>,
    );

    // Assert
    expect(intersectionObserverMetrics().created).toBe(2);
  });

  it("pool: per-target record delivery -> routes to the owning subscriber only", async () => {
    // Arrange
    const onIntersectFirst = vi.fn<IntersectionChangeHandler>();
    const onIntersectSecond = vi.fn<IntersectionChangeHandler>();
    render(
      <>
        <Probe testId="first" threshold={0.5} onIntersect={onIntersectFirst} />
        <Probe testId="second" threshold={0.5} onIntersect={onIntersectSecond} />
      </>,
    );

    // Act
    await emitIntersectionForTarget(screen.getByTestId("first"), true);

    // Assert
    expect(onIntersectFirst).toHaveBeenCalledTimes(1);
    expect(onIntersectSecond).not.toHaveBeenCalled();
  });

  it("pool: two subscriptions on one target with equal options -> one observer routes to both", async () => {
    // Arrange
    const onIntersectA = vi.fn<IntersectionChangeHandler>();
    const onIntersectB = vi.fn<IntersectionChangeHandler>();

    function DualProbe() {
      const first = useIntersectionObserver({ threshold: 0.5, onIntersect: onIntersectA });
      const second = useIntersectionObserver({ threshold: [0.5], onIntersect: onIntersectB });
      // A stable combined ref keeps React from churning detach/attach on rerenders.
      const combinedRef = useCallback(
        (node: HTMLElement | null) => {
          first.ref(node);
          second.ref(node);
        },
        [first.ref, second.ref],
      );
      return <div data-testid="dual" ref={combinedRef} />;
    }

    render(<DualProbe />);

    // Act
    await emitIntersectionForTarget(screen.getByTestId("dual"), true);

    // Assert
    expect(intersectionObserverMetrics().created).toBe(1);
    expect(onIntersectA).toHaveBeenCalledTimes(1);
    expect(onIntersectB).toHaveBeenCalledTimes(1);
  });

  it("pool: freezing one target -> other targets keep observing through the shared observer", async () => {
    // Arrange
    const onIntersectOnce = vi.fn<IntersectionChangeHandler>();
    const onIntersectKeep = vi.fn<IntersectionChangeHandler>();
    render(
      <>
        <Probe testId="once" threshold={0.5} freezeOnceVisible onIntersect={onIntersectOnce} />
        <Probe testId="keep" threshold={0.5} onIntersect={onIntersectKeep} />
      </>,
    );

    // Act
    await emitIntersectionForTarget(screen.getByTestId("once"), true);

    // Assert: the frozen target is released while the sibling keeps observing.
    expect(onIntersectOnce).toHaveBeenCalledTimes(1);
    expect(intersectionObserverMetrics().observing).toBe(1);

    await emitIntersectionForTarget(screen.getByTestId("keep"), true);

    expect(onIntersectKeep).toHaveBeenCalledTimes(1);
    expect(hasActiveIntersectionObserver()).toBe(true);
  });

  it("pool: partial unmount -> shared observer keeps serving the remaining target", () => {
    // Arrange: separate roots so one probe can unmount independently.
    render(<Probe testId="first" threshold={0.5} />);
    const secondRoot = render(<Probe testId="second" threshold={0.5} />);

    // Act
    secondRoot.unmount();

    // Assert
    expect(intersectionObserverMetrics().created).toBe(1);
    expect(intersectionObserverMetrics().observing).toBe(1);
    expect(intersectionObserverMetrics().disconnected).toBe(0);
    expect(hasActiveIntersectionObserver()).toBe(true);
  });

  it("pool: final unsubscribe -> shared observer disconnects and registry drains", () => {
    // Arrange
    const firstRoot = render(<Probe testId="first" threshold={0.5} />);
    const secondRoot = render(<Probe testId="second" threshold={0.5} />);

    // Act
    firstRoot.unmount();
    secondRoot.unmount();

    // Assert
    expect(intersectionObserverMetrics().observing).toBe(0);
    expect(intersectionObserverMetrics().disconnected).toBe(1);
    expect(hasActiveIntersectionObserver()).toBe(false);
    expect(getIntersectionObserverPoolStatsForTests()).toEqual({
      sharedObservers: 0,
      subscriptions: 0,
    });
  });

  it("pool: repeated mount/unmount cycles -> no observation or registry retention", () => {
    // Arrange
    const cycles = 3;

    // Act
    for (let index = 0; index < cycles; index += 1) {
      const cycleRoot = render(
        <>
          <Probe testId={`a-${index}`} threshold={0.5} />
          <Probe testId={`b-${index}`} threshold={0.5} />
        </>,
      );
      cycleRoot.unmount();
    }

    // Assert: every cycle drained its subscriptions before the next one.
    expect(intersectionObserverMetrics().observing).toBe(0);
    expect(hasActiveIntersectionObserver()).toBe(false);
    expect(getIntersectionObserverPoolStatsForTests()).toEqual({
      sharedObservers: 0,
      subscriptions: 0,
    });
  });
});

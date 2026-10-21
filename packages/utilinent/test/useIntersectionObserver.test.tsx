import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Observer } from "../src";
import { useIntersectionObserver } from "../src/hooks/useIntersectionObserver";
import {
  emitIntersection,
  hasActiveIntersectionObserver,
  installControlledIntersectionObserver,
  intersectionObserverMetrics,
} from "./controlledIntersectionObserver";

type IntersectionChangeHandler = (
  isIntersecting: boolean,
  entry: IntersectionObserverEntry,
) => void;

type IntersectionProbeProps = {
  readonly onChange: IntersectionChangeHandler;
};

function IntersectionProbe({ onChange }: IntersectionProbeProps) {
  const { ref } = useIntersectionObserver({ onChange });
  return <div ref={ref} />;
}

describe("useIntersectionObserver", () => {
  beforeEach(installControlledIntersectionObserver);

  it("notifies when the initial observer record is intersecting", async () => {
    const onChange = vi.fn<IntersectionChangeHandler>();
    render(<IntersectionProbe onChange={onChange} />);

    await emitIntersection(true);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ isIntersecting: true, intersectionRatio: 1 }),
    );
  });

  it("freezes and disconnects a triggerOnce observer on an initially visible record", async () => {
    const onIntersect = vi.fn<IntersectionChangeHandler>();
    const rendered = render(
      <Observer triggerOnce={true} onIntersect={onIntersect} threshold={0}>
        visible
      </Observer>,
    );

    await emitIntersection(true);

    expect(onIntersect).toHaveBeenCalledTimes(1);
    expect(hasActiveIntersectionObserver()).toBe(false);

    rendered.rerender(
      <Observer triggerOnce={true} onIntersect={onIntersect} threshold={0.5}>
        visible
      </Observer>,
    );
    expect(hasActiveIntersectionObserver()).toBe(false);
  });

  it("notifies only on later non-intersecting to intersecting transitions", async () => {
    const onChange = vi.fn<IntersectionChangeHandler>();
    render(<IntersectionProbe onChange={onChange} />);

    await emitIntersection(false);
    await emitIntersection(true);
    await emitIntersection(true);
    await emitIntersection(false);
    await emitIntersection(true);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls.map(([isIntersecting]) => isIntersecting)).toEqual([
      true,
      true,
    ]);
  });
});

describe("useIntersectionObserver threshold stabilization", () => {
  beforeEach(installControlledIntersectionObserver);

  it("useIntersectionObserver: hook-owner inline equal-value threshold array across record-driven renders -> single native observer", async () => {
    // Arrange: the hook owner creates a fresh array identity on every render,
    // which is the regression shape from #143.
    function Host({ ratio }: { readonly ratio: number }) {
      const threshold = [0, ratio];
      const { ref } = useIntersectionObserver({ threshold });
      return <div ref={ref} data-testid="target" />;
    }

    const rendered = render(<Host ratio={0.5} />);

    // Act: each delivered record re-renders the owner and rebuilds the array.
    await emitIntersection(true);
    await emitIntersection(true);
    await emitIntersection(true);
    await emitIntersection(false);

    // Assert: equal values keep one subscription and one native observer.
    expect(intersectionObserverMetrics().created).toBe(1);
    expect(intersectionObserverMetrics().observing).toBe(1);

    rendered.rerender(<Host ratio={0.25} />);

    // A real threshold value change replaces the observation.
    expect(intersectionObserverMetrics().created).toBe(2);
    expect(intersectionObserverMetrics().observing).toBe(1);
  });

  it("useIntersectionObserver: reordered or duplicated equal-value threshold arrays -> no resubscription", () => {
    // Arrange
    function Host({ threshold }: { readonly threshold: number[] }) {
      const { ref } = useIntersectionObserver({ threshold });
      return <div ref={ref} data-testid="target" />;
    }

    const rendered = render(<Host threshold={[0, 0.5]} />);

    // Act
    rendered.rerender(<Host threshold={[0.5, 0]} />);
    rendered.rerender(<Host threshold={[0, 0.5, 0.5]} />);

    // Assert
    expect(intersectionObserverMetrics().created).toBe(1);
    expect(intersectionObserverMetrics().observing).toBe(1);
  });
});

describe("useIntersectionObserver target-scoped freeze", () => {
  beforeEach(installControlledIntersectionObserver);

  it("useIntersectionObserver: frozen target detached then reattached -> observation resumes", async () => {
    // Arrange
    const onIntersect = vi.fn<IntersectionChangeHandler>();
    function Host() {
      const [attached, setAttached] = useState(true);
      const { ref, isIntersecting } = useIntersectionObserver({
        freezeOnceVisible: true,
        onIntersect,
      });
      return (
        <button type="button" onClick={() => setAttached((value) => !value)}>
          {isIntersecting ? "visible" : "hidden"}
          {attached ? <span ref={ref} data-testid="target" /> : null}
        </button>
      );
    }

    render(<Host />);

    // Act
    await emitIntersection(true);
    fireEvent.click(screen.getByRole("button"));

    // Assert: detaching resets both the boolean and the frozen lifetime.
    expect(screen.getByText("hidden")).toBeInTheDocument();
    expect(hasActiveIntersectionObserver()).toBe(false);

    fireEvent.click(screen.getByRole("button"));
    expect(hasActiveIntersectionObserver()).toBe(true);

    await emitIntersection(true);

    expect(onIntersect).toHaveBeenCalledTimes(2);
    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("useIntersectionObserver: frozen target swapped for a new node -> new node is observed", async () => {
    // Arrange
    function Host({ which }: { readonly which: "a" | "b" }) {
      const { ref, isIntersecting } = useIntersectionObserver({
        freezeOnceVisible: true,
      });
      return (
        <div key={which} ref={ref}>
          {isIntersecting ? "visible" : "hidden"}
        </div>
      );
    }

    const rendered = render(<Host which="a" />);

    // Act
    await emitIntersection(true);
    rendered.rerender(<Host which="b" />);

    // Assert: the swap happens in one commit, so element never becomes null.
    expect(hasActiveIntersectionObserver()).toBe(true);

    await emitIntersection(false);

    expect(screen.getByText("hidden")).toBeInTheDocument();
  });

  it("useIntersectionObserver: freezeOnceVisible disabled after a freeze -> observation resumes", async () => {
    // Arrange
    function Host({ freeze }: { readonly freeze: boolean }) {
      const { ref, isIntersecting } = useIntersectionObserver({
        freezeOnceVisible: freeze,
      });
      return <div ref={ref}>{isIntersecting ? "visible" : "hidden"}</div>;
    }

    const rendered = render(<Host freeze={true} />);
    await emitIntersection(true);

    // Act
    rendered.rerender(<Host freeze={false} />);
    await emitIntersection(false);

    // Assert
    expect(screen.getByText("hidden")).toBeInTheDocument();

    await emitIntersection(true);

    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("useIntersectionObserver: target removal returns to initialIsIntersecting until the next record", async () => {
    // Arrange
    function Host({ attached }: { readonly attached: boolean }) {
      const { ref, isIntersecting } = useIntersectionObserver({
        freezeOnceVisible: true,
        initialIsIntersecting: true,
      });
      return attached ? (
        <div ref={ref}>{isIntersecting ? "visible" : "hidden"}</div>
      ) : (
        <em>{isIntersecting ? "visible" : "hidden"}</em>
      );
    }

    const rendered = render(<Host attached={true} />);
    await emitIntersection(false);
    expect(screen.getByText("hidden")).toBeInTheDocument();

    // Act
    rendered.rerender(<Host attached={false} />);

    // Assert
    expect(screen.getByText("visible")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Observer } from "../../src";
import { useIntersectionObserver } from "../../src/hooks";
import {
  emitIntersection,
  emitIntersectionForTarget,
  installControlledIntersectionObserver,
} from "../fixtures/controlledIntersectionObserver";

describe("Observer boolean-only subscription", () => {
  beforeEach(installControlledIntersectionObserver);

  it("Observer: same-boolean records with fresh entries -> no additional child commits", async () => {
    // Arrange: a child component behind the render-prop counts its own
    // commits, which is the contract #140 targets — React may still run a
    // bail-out render, but same-boolean records must not commit.
    let childRenders = 0;
    function CountedChild() {
      childRenders += 1;
      return <span>content</span>;
    }

    render(
      <Observer>
        {() => <CountedChild />}
      </Observer>,
    );

    // Act
    await emitIntersection(true);
    expect(screen.getByText("content")).toBeInTheDocument();
    const rendersAfterBooleanTransition = childRenders;

    await emitIntersection(true);
    await emitIntersection(true);

    // Assert: fresh entries with an unchanged boolean commit nothing.
    expect(childRenders).toBe(rendersAfterBooleanTransition);
  });

  it("useIntersectionObserver: same-boolean records with fresh entries -> entry consumers keep receiving updates", async () => {
    // Arrange
    function EntryProbe() {
      const { ref, entry } = useIntersectionObserver();
      return (
        <div ref={ref}>{entry ? `ratio:${entry.intersectionRatio}` : "no-entry"}</div>
      );
    }

    const { container } = render(<EntryProbe />);
    const target = container.firstElementChild as HTMLElement;

    // Act
    await emitIntersectionForTarget(target, true, 1);

    // Assert
    expect(screen.getByText("ratio:1")).toBeInTheDocument();

    await emitIntersectionForTarget(target, true, 0.6);

    expect(screen.getByText("ratio:0.6")).toBeInTheDocument();
  });

  it("Observer: boolean transitions -> swaps fallback and children content", async () => {
    // Arrange
    render(
      <Observer fallback={<p>pending</p>}>
        {() => <p>ready</p>}
      </Observer>,
    );

    // Act
    await emitIntersection(true);

    // Assert
    expect(screen.getByText("ready")).toBeInTheDocument();

    await emitIntersection(false);

    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("Observer: freeze lifetime -> triggerOnce stops observation after the first intersection", async () => {
    // Arrange
    const onIntersect = vi.fn();
    render(
      <Observer triggerOnce onIntersect={onIntersect}>
        {() => <p>ready</p>}
      </Observer>,
    );

    // Act
    await emitIntersection(true);

    // Assert
    expect(onIntersect).toHaveBeenCalledTimes(1);
    expect(screen.getByText("ready")).toBeInTheDocument();
  });
});

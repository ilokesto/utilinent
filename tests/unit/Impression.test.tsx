import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Impression } from "../../src";
import {
  emitIntersectionForTarget, enterViewport, installControlledIntersectionObserver,
  intersectionObserverMetrics,
} from "../fixtures/controlledIntersectionObserver";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  installControlledIntersectionObserver();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function advance(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

function visibility(state: DocumentVisibilityState) {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue(state);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
}

it("Impression: continuous threshold visibility -> starts once after the full default duration", async () => {
  const onStart = vi.fn();
  const ref = createRef<HTMLDivElement>();
  render(<Impression ref={ref} onStart={onStart} data-testid="target">
    {(active) => String(active)}
  </Impression>);
  const target = screen.getByTestId("target");

  await emitIntersectionForTarget(target, true, 0.49);
  advance(2000);
  expect(onStart).not.toHaveBeenCalled();
  await emitIntersectionForTarget(target, true, 0.5);
  advance(999);
  expect(onStart).not.toHaveBeenCalled();
  advance(1);

  expect(onStart).toHaveBeenCalledTimes(1);
  expect(target).toHaveTextContent("true");
  expect(target.tagName).toBe("DIV");
  expect(ref.current).toBe(target);
  await emitIntersectionForTarget(target, true, 0.8);
  advance(2000);
  expect(onStart).toHaveBeenCalledTimes(1);
});

it("Impression: leaving before qualification -> cancels and requires a fresh continuous duration", async () => {
  const onStart = vi.fn();
  const onEnd = vi.fn();
  render(<Impression duration={100} onStart={onStart} onEnd={onEnd} data-testid="target" />);
  const target = screen.getByTestId("target");
  await emitIntersectionForTarget(target, true);
  advance(80);

  await emitIntersectionForTarget(target, true, 0.2);
  advance(100);
  expect(onStart).not.toHaveBeenCalled();
  expect(onEnd).not.toHaveBeenCalled();
  await emitIntersectionForTarget(target, true, 0.5);
  advance(99);
  expect(onStart).not.toHaveBeenCalled();
  advance(1);

  expect(onStart).toHaveBeenCalledTimes(1);
  await emitIntersectionForTarget(target, false);
  expect(onEnd).toHaveBeenCalledTimes(1);
  await emitIntersectionForTarget(target, false);
  expect(onEnd).toHaveBeenCalledTimes(1);
});

it("Impression: exit and re-entry in one delivery -> ends and restarts qualification", async () => {
  const onStart = vi.fn();
  const onEnd = vi.fn();
  render(<Impression duration={100} onStart={onStart} onEnd={onEnd} data-testid="target" />);
  await emitIntersectionForTarget(screen.getByTestId("target"), true);
  advance(100);

  await enterViewport();

  expect(onEnd).toHaveBeenCalledTimes(1);
  expect(onStart).toHaveBeenCalledTimes(1);
  advance(100);
  expect(onStart).toHaveBeenCalledTimes(2);
});

it.each([50, 100])("Impression: hidden after %i ms -> cancels pending or ends active exposure", async (elapsed) => {
  const onStart = vi.fn();
  const onEnd = vi.fn();
  render(<Impression duration={100} onStart={onStart} onEnd={onEnd} data-testid="target">
    {(active) => String(active)}
  </Impression>);
  const target = screen.getByTestId("target");
  await emitIntersectionForTarget(target, true);
  advance(elapsed);

  visibility("hidden");
  advance(500);

  expect(onStart).toHaveBeenCalledTimes(elapsed === 100 ? 1 : 0);
  expect(onEnd).toHaveBeenCalledTimes(elapsed === 100 ? 1 : 0);
  expect(target).toHaveTextContent("false");
  visibility("visible");
  advance(99);
  expect(onStart).toHaveBeenCalledTimes(elapsed === 100 ? 1 : 0);
  advance(1);
  expect(onStart).toHaveBeenCalledTimes(elapsed === 100 ? 2 : 1);
});

it("Impression: callback updates during exposure -> uses latest callbacks without restarting time", async () => {
  const oldStart = vi.fn();
  const onStart = vi.fn();
  const oldEnd = vi.fn();
  const onEnd = vi.fn();
  const { rerender, unmount } = render(
    <Impression duration={100} onStart={oldStart} onEnd={oldEnd} data-testid="target" />,
  );
  await emitIntersectionForTarget(screen.getByTestId("target"), true);
  advance(50);

  rerender(<Impression duration={100} onStart={onStart} onEnd={onEnd} data-testid="target" />);
  advance(50);

  expect(oldStart).not.toHaveBeenCalled();
  expect(onStart).toHaveBeenCalledTimes(1);
  unmount();
  expect(oldEnd).not.toHaveBeenCalled();
  expect(onEnd).toHaveBeenCalledTimes(1);
  expect(intersectionObserverMetrics().observing).toBe(0);
});

it("Impression: hidden and visible in one batch -> requires fresh continuous visibility", async () => {
  const onStart = vi.fn();
  render(<Impression duration={100} onStart={onStart} data-testid="target" />);
  await emitIntersectionForTarget(screen.getByTestId("target"), true);
  advance(50);

  act(() => {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  advance(99);

  expect(onStart).not.toHaveBeenCalled();
  advance(1);
  expect(onStart).toHaveBeenCalledTimes(1);
});

it("Impression: raised ratio -> does not qualify a stale lower-ratio record", async () => {
  const onStart = vi.fn();
  const { rerender } = render(<Impression duration={100} onStart={onStart} data-testid="target" />);
  const target = screen.getByTestId("target");
  await emitIntersectionForTarget(target, true, 0.5);
  advance(50);

  rerender(<Impression ratio={0.9} duration={100} onStart={onStart} data-testid="target" />);
  advance(200);

  expect(onStart).not.toHaveBeenCalled();
  await emitIntersectionForTarget(target, true, 0.9);
  advance(100);
  expect(onStart).toHaveBeenCalledTimes(1);
});

it.each([50, 100])("Impression: target replacement after %i ms -> resets the target lifetime", async (elapsed) => {
  const onStart = vi.fn();
  const onEnd = vi.fn();
  const { rerender } = render(
    <Impression key="first" duration={100} onStart={onStart} onEnd={onEnd} data-testid="target" />,
  );
  await emitIntersectionForTarget(screen.getByTestId("target"), true);
  advance(elapsed);

  rerender(<Impression key="second" duration={100} onStart={onStart} onEnd={onEnd} data-testid="target" />);
  advance(500);

  expect(onStart).toHaveBeenCalledTimes(elapsed === 100 ? 1 : 0);
  expect(onEnd).toHaveBeenCalledTimes(elapsed === 100 ? 1 : 0);
  await emitIntersectionForTarget(screen.getByTestId("target"), true);
  advance(100);
  expect(onStart).toHaveBeenCalledTimes(elapsed === 100 ? 2 : 1);
});

it.each(["root", "rootMargin", "ratio"] as const)(
  "Impression: %s changes with zero duration -> waits for a fresh observation",
  async (option) => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const { rerender } = render(
      <Impression duration={0} onStart={onStart} onEnd={onEnd} data-testid="target" />,
    );
    const target = screen.getByTestId("target");
    await emitIntersectionForTarget(target, true);
    const changed = option === "root"
      ? { root: document.createElement("section") }
      : option === "rootMargin" ? { rootMargin: "20px" } : { ratio: 0.25 };

    rerender(
      <Impression {...changed} duration={0} onStart={onStart} onEnd={onEnd} data-testid="target" />,
    );

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledTimes(1);
    await emitIntersectionForTarget(target, true);
    expect(onStart).toHaveBeenCalledTimes(2);
  },
);

it("Impression: duplicate entries during continuous visibility -> preserves qualification and active exposure", async () => {
  const onStart = vi.fn();
  const onEnd = vi.fn();
  render(<Impression duration={100} onStart={onStart} onEnd={onEnd} data-testid="target" />);
  const target = screen.getByTestId("target");
  await emitIntersectionForTarget(target, true);
  advance(50);

  await emitIntersectionForTarget(target, true);
  advance(50);

  expect(onStart).toHaveBeenCalledTimes(1);
  await emitIntersectionForTarget(target, true);
  expect(onStart).toHaveBeenCalledTimes(1);
  expect(onEnd).not.toHaveBeenCalled();
});

it("Impression: options change during qualification -> cancels the previous timer", async () => {
  const onStart = vi.fn();
  const { rerender } = render(<Impression duration={100} onStart={onStart} data-testid="target" />);
  const target = screen.getByTestId("target");
  await emitIntersectionForTarget(target, true);
  advance(50);

  rerender(<Impression duration={200} onStart={onStart} data-testid="target" />);
  advance(199);

  expect(onStart).not.toHaveBeenCalled();
  advance(1);
  expect(onStart).toHaveBeenCalledTimes(1);
});

it("Impression: StrictMode and pending unmount -> releases observation and all timers", async () => {
  const onStart = vi.fn();
  const onEnd = vi.fn();
  const { unmount } = render(<StrictMode>
    <Impression duration={100} onStart={onStart} onEnd={onEnd} data-testid="target" />
  </StrictMode>);
  await emitIntersectionForTarget(screen.getByTestId("target"), true);
  advance(50);

  unmount();
  advance(100);

  expect(onStart).not.toHaveBeenCalled();
  expect(onEnd).not.toHaveBeenCalled();
  expect(intersectionObserverMetrics().observing).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
});

it("Impression: zero duration in StrictMode -> one balanced active exposure", async () => {
  const onStart = vi.fn();
  const onEnd = vi.fn();
  const ref = createRef<HTMLButtonElement>();
  const { unmount } = render(<StrictMode>
    <Impression.button type="button" ref={ref} ratio={0} duration={0}
      onStart={onStart} onEnd={onEnd} root={document.body} rootMargin="12px"
      data-testid="target">Story</Impression.button>
  </StrictMode>);
  const target = screen.getByRole("button");
  await emitIntersectionForTarget(target, true, 0);

  expect(onStart).toHaveBeenCalledTimes(1);
  expect(ref.current).toBe(target);
  expect(target).toHaveAttribute("type", "button");
  for (const prop of ["ratio", "duration", "root", "rootMargin", "onStart", "onEnd"]) {
    expect(target).not.toHaveAttribute(prop);
  }
  unmount();
  expect(onEnd).toHaveBeenCalledTimes(1);
});

it("Impression: changed forwarded ref -> retains the same observation lifetime", async () => {
  const first = vi.fn();
  const second = vi.fn();
  const onStart = vi.fn();
  const { rerender } = render(<Impression ref={first} duration={100} onStart={onStart} data-testid="target" />);
  const target = screen.getByTestId("target");
  await emitIntersectionForTarget(target, true);
  advance(50);

  rerender(<Impression ref={second} duration={100} onStart={onStart} data-testid="target" />);
  advance(50);

  expect(onStart).toHaveBeenCalledTimes(1);
  expect(first).toHaveBeenLastCalledWith(null);
  expect(second).toHaveBeenLastCalledWith(target);
});

it("Impression: server rendering or missing observer -> renders without starting exposure", () => {
  const onStart = vi.fn();
  const html = renderToString(<Impression onStart={onStart}>Story</Impression>);
  expect(html).toContain("Story");
  expect(intersectionObserverMetrics().created).toBe(0);
  vi.stubGlobal("IntersectionObserver", undefined);

  render(<Impression onStart={onStart}>Client story</Impression>);
  advance(2000);

  expect(screen.getByText("Client story")).toBeInTheDocument();
  expect(onStart).not.toHaveBeenCalled();
});

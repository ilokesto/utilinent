import { act, render, screen } from "@testing-library/react";
import { createRef, forwardRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LoadMore, PluginManager } from "../src";
import {
  emitIntersectionForTarget, installControlledIntersectionObserver,
  intersectionObserverMetrics,
} from "./controlledIntersectionObserver";

beforeEach(installControlledIntersectionObserver);
afterEach(() => PluginManager.unregister("loadMore", "SentinelLink"));

it("LoadMore: empty default sentinel -> remains measurable and forwards ref and DOM props", () => {
  const ref = createRef<HTMLDivElement>();

  render(<LoadMore ref={ref} onLoadMore={vi.fn()} hasMore className="sentinel" data-testid="sentinel" />);

  const sentinel = screen.getByTestId("sentinel");
  expect(sentinel.tagName).toBe("DIV");
  expect(ref.current).toBe(sentinel);
  expect(sentinel).toHaveStyle({ minHeight: "1px", minWidth: "1px", display: "block" });
  expect(sentinel).toHaveClass("sentinel");
  expect(sentinel).not.toHaveAttribute("hasMore");
});

it("LoadMore: StrictMode visible sentinel -> one request and complete cleanup", async () => {
  const onLoadMore = vi.fn();
  const { unmount } = render(
    <StrictMode>
      <LoadMore.section onLoadMore={onLoadMore} hasMore data-testid="sentinel">
        {({ isIntersecting, isLoading }) => `${isIntersecting}:${isLoading}`}
      </LoadMore.section>
    </StrictMode>,
  );
  const sentinel = screen.getByTestId("sentinel");

  await emitIntersectionForTarget(sentinel, true);
  await emitIntersectionForTarget(sentinel, true);

  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(sentinel).toHaveTextContent("true:false");
  expect(sentinel.tagName).toBe("SECTION");
  unmount();
  expect(intersectionObserverMetrics().observing).toBe(0);
});

it("LoadMore: changing forwarded callback ref -> preserves live observation", async () => {
  const firstRef = vi.fn();
  const secondRef = vi.fn();
  const onLoadMore = vi.fn();
  const { rerender } = render(
    <LoadMore ref={firstRef} onLoadMore={onLoadMore} hasMore data-testid="sentinel" />,
  );
  const sentinel = screen.getByTestId("sentinel");
  rerender(<LoadMore ref={secondRef} onLoadMore={onLoadMore} hasMore data-testid="sentinel" />);

  await emitIntersectionForTarget(sentinel, true);

  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(firstRef).toHaveBeenLastCalledWith(null);
  expect(secondRef).toHaveBeenLastCalledWith(sentinel);
});

const SentinelLink = forwardRef<HTMLAnchorElement, { destination: string; children?: React.ReactNode }>(
  function SentinelLink({ destination, ...props }, ref) {
    return <a {...props} href={destination} ref={ref} />;
  },
);

declare module "../src/types/register" {
  interface UtilinentRegister {
    loadMore: { SentinelLink: typeof SentinelLink };
  }
}

it("LoadMore: registered proxy target -> forwards custom props and observes its DOM ref", async () => {
  PluginManager.register({ loadMore: { SentinelLink } });
  const ref = createRef<HTMLAnchorElement>();
  const onLoadMore = vi.fn();
  render(<LoadMore.SentinelLink destination="/next" ref={ref} onLoadMore={onLoadMore} hasMore>Next</LoadMore.SentinelLink>);
  const link = screen.getByRole("link", { name: "Next" });

  await emitIntersectionForTarget(link, true);

  expect(link).toHaveAttribute("href", "/next");
  expect(ref.current).toBe(link);
  expect(onLoadMore).toHaveBeenCalledTimes(1);
});

it("LoadMore: button retry render prop -> forwards native button props and invokes guarded retry", async () => {
  const onLoadMore = vi.fn();
  render(
    <LoadMore onLoadMore={onLoadMore} hasMore>
      {({ retry }) => <button type="button" onClick={retry}>Retry</button>}
    </LoadMore>,
  );

  await act(async () => screen.getByRole("button", { name: "Retry" }).click());

  expect(onLoadMore).toHaveBeenCalledTimes(1);
});

it("LoadMore: server render -> keeps the sentinel without starting work", () => {
  const onLoadMore = vi.fn();

  const html = renderToString(<LoadMore onLoadMore={onLoadMore} hasMore>Next page</LoadMore>);

  expect(html).toContain("Next page");
  expect(onLoadMore).not.toHaveBeenCalled();
  expect(intersectionObserverMetrics().created).toBe(0);
});

it("LoadMore: React 19 callback-ref cleanup -> releases the external ref and observer", () => {
  const release = vi.fn();
  const ref = vi.fn(() => release);
  const { unmount } = render(<LoadMore ref={ref} onLoadMore={vi.fn()} hasMore />);

  unmount();

  expect(release).toHaveBeenCalledTimes(1);
  expect(intersectionObserverMetrics().observing).toBe(0);
});

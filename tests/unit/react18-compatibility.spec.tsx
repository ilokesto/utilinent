import { createRef, forwardRef, StrictMode, type ReactNode, type Ref } from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LoadMore, Observer, PluginManager, Slot, Slottable } from "../../src";
import {
  emitIntersectionForTarget,
  installControlledIntersectionObserver,
  intersectionObserverMetrics,
} from "../fixtures/controlledIntersectionObserver";

beforeEach(installControlledIntersectionObserver);
afterEach(() => {
  vi.restoreAllMocks();
  PluginManager.unregister("loadMore", "SentinelLink");
});

for (const name of ["Slot", "Observer", "LoadMore"] as const) {
  function target(ref: Ref<HTMLDivElement>) {
    if (name === "Slot") {
      return <Slot ref={ref}><div data-testid="target" /></Slot>;
    }
    if (name === "Observer") {
      return <Observer ref={ref} data-testid="target" />;
    }
    return <LoadMore ref={ref} onLoadMore={vi.fn()} hasMore data-testid="target" />;
  }

  it(`${name}: callback ref replacement -> stable attachment then null detachment and new ownership`, () => {
    const first = vi.fn();
    const second = vi.fn();
    const rendered = render(target(first));
    const node = screen.getByTestId("target");
    rendered.rerender(target(first));
    expect(first).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith(node);

    rendered.rerender(target(second));

    expect(first).toHaveBeenCalledTimes(2);
    expect(first).toHaveBeenLastCalledWith(null);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(node);
    rendered.unmount();
    expect(second).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenLastCalledWith(null);
    expect(intersectionObserverMetrics().observing).toBe(0);
  });

  it(`${name}: object ref across stable rerenders -> retains the node and clears on unmount`, () => {
    const ref = createRef<HTMLDivElement>();
    const rendered = render(target(ref));
    const node = screen.getByTestId("target");
    rendered.rerender(target(ref));
    expect(ref.current).toBe(node);

    rendered.unmount();

    expect(ref.current).toBeNull();
    expect(intersectionObserverMetrics().observing).toBe(0);
  });
}

it("Slot: child props and handlers -> merges presentation and invokes child before parent", () => {
  const calls: string[] = [];
  render(
    <Slot className="slot" style={{ margin: "4px" }} onClick={() => calls.push("slot")}>
      <button className="child" style={{ color: "red" }} onClick={() => calls.push("child")}>Go</button>
    </Slot>,
  );
  const button = screen.getByRole("button");

  fireEvent.click(button);

  expect(button).toHaveClass("slot", "child");
  expect(button).toHaveStyle({ margin: "4px", color: "rgb(255, 0, 0)" });
  expect(calls).toEqual(["child", "slot"]);
});

it.each([
  { scenario: "text", child: "text", warnings: 1 },
  { scenario: "false", child: false, warnings: 0 },
])("Slot: $scenario child -> renders nothing with the expected warning policy", ({ child, warnings }) => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  const { container } = render(<Slot>{child}</Slot>);

  expect(container.innerHTML).toBe("");
  expect(warn).toHaveBeenCalledTimes(warnings);
});

it("Slot: multiple children -> merges only the first and warns", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  render(<Slot className="slot"><button>First</button><span>Second</span></Slot>);

  expect(screen.getByRole("button")).toHaveClass("slot");
  expect(screen.queryByText("Second")).toBeNull();
  expect(warn).toHaveBeenCalledTimes(1);
});

it("Slottable: invalid target -> preserves siblings and warns", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  render(<Slot className="slot"><span>Sibling</span><Slottable>text</Slottable></Slot>);

  expect(screen.getByText("Sibling")).not.toHaveClass("slot");
  expect(screen.queryByText("text")).toBeNull();
  expect(warn).toHaveBeenCalledTimes(1);
});

it("Slottable: stable refs and host replacement -> keeps siblings and transfers ref ownership exactly once", () => {
  const ref = vi.fn();
  const link = () => (
    <Slot ref={ref} className="slot">
      <span>Sibling</span><Slottable><a href="/docs">Docs</a></Slottable>
    </Slot>
  );
  const rendered = render(link());
  const anchor = screen.getByRole("link");
  rendered.rerender(link());
  expect(ref).toHaveBeenCalledTimes(1);
  expect(anchor).toHaveClass("slot");
  expect(screen.getByText("Sibling")).not.toHaveClass("slot");

  rendered.rerender(<Slot ref={ref}><button>Go</button></Slot>);

  expect(ref.mock.calls.map(([node]) => node)).toEqual([anchor, null, screen.getByRole("button")]);
  rendered.rerender(link());
  expect(ref).toHaveBeenCalledTimes(5);
  expect(ref.mock.calls[3][0]).toBeNull();
  expect(ref.mock.calls[4][0]).toBe(screen.getByRole("link"));
});

it("Slot: child callback changes beside a stable forwarded ref -> detaches the old child and attaches the new child", () => {
  const forwarded = vi.fn();
  const first = vi.fn();
  const second = vi.fn();
  const rendered = render(<Slot ref={forwarded}><button ref={first}>Go</button></Slot>);
  const button = screen.getByRole("button");
  rendered.rerender(<Slot ref={forwarded}><button ref={first}>Go</button></Slot>);
  expect(forwarded).toHaveBeenCalledTimes(1);
  expect(first).toHaveBeenCalledTimes(1);

  rendered.rerender(<Slot ref={forwarded}><button ref={second}>Go</button></Slot>);

  expect(first.mock.calls.map(([node]) => node)).toEqual([button, null]);
  expect(second).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledWith(button);
  expect(forwarded.mock.calls.map(([node]) => node)).toEqual([button, null, button]);
});

it("Observer: replaced ref and viewport entry -> preserves observation and renders content", async () => {
  const first = vi.fn();
  const second = vi.fn();
  const rendered = render(<Observer ref={first} fallback="Waiting" data-testid="target">Visible</Observer>);
  const node = screen.getByTestId("target");
  expect(node).toHaveTextContent("Waiting");
  rendered.rerender(<Observer ref={second} fallback="Waiting" data-testid="target">Visible</Observer>);

  await emitIntersectionForTarget(node, true);

  expect(node).toHaveTextContent("Visible");
  expect(first).toHaveBeenLastCalledWith(null);
  expect(second).toHaveBeenLastCalledWith(node);
  rendered.unmount();
  expect(intersectionObserverMetrics().observing).toBe(0);
});

it("LoadMore: empty sentinel -> stays measurable and forwards ordinary DOM props", () => {
  const ref = createRef<HTMLDivElement>();

  render(<LoadMore ref={ref} onLoadMore={vi.fn()} hasMore className="sentinel" data-testid="target" />);

  const node = screen.getByTestId("target");
  expect(ref.current).toBe(node);
  expect(node.tagName).toBe("DIV");
  expect(node).toHaveStyle({ minHeight: "1px", minWidth: "1px", display: "block" });
  expect(node).toHaveClass("sentinel");
  expect(node).not.toHaveAttribute("hasMore");
});

it("LoadMore: StrictMode intersection events -> starts one request and releases observation", async () => {
  const onLoadMore = vi.fn();
  const rendered = render(
    <StrictMode>
      <LoadMore.section onLoadMore={onLoadMore} hasMore data-testid="target">
        {({ isIntersecting, isLoading }) => `${isIntersecting}:${isLoading}`}
      </LoadMore.section>
    </StrictMode>,
  );
  const node = screen.getByTestId("target");

  await emitIntersectionForTarget(node, true);
  await emitIntersectionForTarget(node, true);

  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(node).toHaveTextContent("true:false");
  expect(node.tagName).toBe("SECTION");
  rendered.unmount();
  expect(intersectionObserverMetrics().observing).toBe(0);
});

it("LoadMore: forwarded ref replacement -> viewport entry still triggers a request", async () => {
  const onLoadMore = vi.fn();
  const first = vi.fn();
  const second = vi.fn();
  const rendered = render(<LoadMore ref={first} onLoadMore={onLoadMore} hasMore data-testid="target" />);
  const node = screen.getByTestId("target");
  rendered.rerender(<LoadMore ref={second} onLoadMore={onLoadMore} hasMore data-testid="target" />);

  await emitIntersectionForTarget(node, true);

  expect(onLoadMore).toHaveBeenCalledTimes(1);
  expect(first).toHaveBeenLastCalledWith(null);
  expect(second).toHaveBeenLastCalledWith(node);
});

const SentinelLink = forwardRef<HTMLAnchorElement, { destination: string; children?: ReactNode }>(
  function SentinelLink({ destination, ...props }, ref) {
    return <a {...props} href={destination} ref={ref} />;
  },
);

declare module "../../src/types/register" {
  interface UtilinentRegister {
    loadMore: { SentinelLink: typeof SentinelLink };
  }
}

it("LoadMore: registered proxy -> forwards custom props and observes the linked host", async () => {
  PluginManager.register({ loadMore: { SentinelLink } });
  const ref = createRef<HTMLAnchorElement>();
  const onLoadMore = vi.fn();
  render(<LoadMore.SentinelLink destination="/next" ref={ref} onLoadMore={onLoadMore} hasMore>Next</LoadMore.SentinelLink>);
  const link = screen.getByRole("link");

  await emitIntersectionForTarget(link, true);

  expect(ref.current).toBe(link);
  expect(link).toHaveAttribute("href", "/next");
  expect(onLoadMore).toHaveBeenCalledTimes(1);
});

it("LoadMore: explicit retry button -> invokes the guarded request", async () => {
  const onLoadMore = vi.fn();
  render(<LoadMore onLoadMore={onLoadMore} hasMore>{({ retry }) => <button onClick={retry}>Retry</button>}</LoadMore>);

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  });

  expect(onLoadMore).toHaveBeenCalledTimes(1);
});

it("LoadMore: server rendering -> retains sentinel content without starting work", () => {
  const onLoadMore = vi.fn();

  const html = renderToString(<LoadMore onLoadMore={onLoadMore} hasMore>Next</LoadMore>);

  expect(html).toContain("Next");
  expect(onLoadMore).not.toHaveBeenCalled();
  expect(intersectionObserverMetrics().created).toBe(0);
});

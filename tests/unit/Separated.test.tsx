import { fireEvent, render, screen } from "@testing-library/react";
import { createRef, Fragment, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Separated } from "../../src";

describe("Separated", () => {
  it.each([
    { each: [], expected: "" },
    { each: ["hello"], expected: "<span>hello</span>" },
    {
      each: ["hello", "react", "world"],
      expected: "<span>hello</span><hr><span>react</span><hr><span>world</span>",
    },
  ])("renders $each with separators only between items", ({ each, expected }) => {
    const { container } = render(
      <Separated each={each} by={<hr />}>
        {(item) => <span key={item}>{item}</span>}
      </Separated>,
    );

    expect(container.innerHTML).toBe(expected);
  });

  it("omits nullish and boolean results before separating text and zero", () => {
    const nodes = [null, "hello", false, undefined, 0, true, "world", null];

    const { container } = render(
      <Separated each={nodes} by="|">{(node) => node}</Separated>,
    );

    expect(container.textContent).toBe("hello|0|world");
  });

  it("passes original indexes to the renderer when earlier results are omitted", () => {
    const { container } = render(
      <Separated each={["skip", "hello", "world"]} by="|">
        {(item, index) => index === 0 ? null : `${index}:${item}`}
      </Separated>,
    );

    expect(container.textContent).toBe("1:hello|2:world");
  });

  it("flattens returned arrays but keeps fragments as one rendered node", () => {
    const { container } = render(
      <Separated each={["array", "fragment"]} by="|">
        {(item) => item === "array"
          ? ["a", null, "b"]
          : <Fragment key={item}><span>c</span><span>d</span></Fragment>}
      </Separated>,
    );

    expect(container.innerHTML).toBe("a|b|<span>c</span><span>d</span>");
  });

  it.each<ReactNode>([null, false])("accepts an empty separator (%s) without dropping items", (by) => {
    const { container } = render(
      <Separated each={["hello", "world"]} by={by}>{(item) => item}</Separated>,
    );

    expect(container.textContent).toBe("helloworld");
  });

  it("retains keyed input identity and user edits across insertion, removal and reordering", () => {
    const list = (items: string[]) => (
      <Separated each={items} by={<hr />}>
        {(item) => <input key={item} aria-label={item} defaultValue={item} />}
      </Separated>
    );
    const { rerender, container } = render(list(["hello", "react", "world"]));
    const hello = screen.getByRole("textbox", { name: "hello" });
    fireEvent.change(hello, { target: { value: "edited" } });

    rerender(list(["new", "world", "hello"]));

    expect(screen.getByRole("textbox", { name: "hello" })).toBe(hello);
    expect(hello).toHaveValue("edited");
    expect(screen.getAllByRole("textbox").map((node) => node.getAttribute("aria-label")))
      .toEqual(["new", "world", "hello"]);
    expect(Array.from(container.children, (node) => node.tagName))
      .toEqual(["INPUT", "HR", "INPUT", "HR", "INPUT"]);
  });

  it("forwards tag props, events and refs without leaking its own props", () => {
    const ref = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    const { container } = render(
      <Separated.div each={["hello", "world"]} by="|" ref={ref} className="list" onClick={onClick}>
        {(item) => item}
      </Separated.div>,
    );
    const wrapper = container.firstElementChild;

    fireEvent.click(screen.getByText("hello|world"));

    expect(ref.current).toBe(wrapper);
    expect(wrapper?.outerHTML).toBe('<div class="list">hello|world</div>');
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

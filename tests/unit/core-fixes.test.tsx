import { createRef, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OptionalWrapper, Observer } from "../../src/index";
import {
  emitIntersection,
  installControlledIntersectionObserver,
} from "../fixtures/controlledIntersectionObserver";

describe("useIntersectionObserver onIntersect", () => {
  beforeEach(installControlledIntersectionObserver);

  it("invokes the canonical onIntersect option on intersection", async () => {
    const onIntersect = vi.fn();
    render(<Observer onIntersect={onIntersect}>visible</Observer>);

    await emitIntersection(true);

    expect(onIntersect).toHaveBeenCalledTimes(1);
    expect(onIntersect).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ isIntersecting: true }),
    );
  });
});

describe("Observer keepMeasurable", () => {
  beforeEach(installControlledIntersectionObserver);

  it("does not force measurable styles by default", () => {
    const { container } = render(<Observer fallback="pending">content</Observer>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.minWidth).toBe("");
    expect(el.style.minHeight).toBe("");
    expect(el.style.display).toBe("");
  });

  it("forces a measurable box when keepMeasurable is set", () => {
    const { container } = render(
      <Observer fallback="pending" keepMeasurable>
        content
      </Observer>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.minWidth).toBe("1px");
    expect(el.style.minHeight).toBe("1px");
    expect(el.style.display).toBe("block");
  });
});

describe("OptionalWrapper elseWrapper", () => {
  it.each([
    { name: "true", when: true, selected: true },
    { name: "false", when: false, selected: false },
    { name: "null", when: null, selected: false },
    { name: "undefined", when: undefined, selected: false },
    { name: "zero", when: 0, selected: false },
    { name: "NaN", when: NaN, selected: false },
    { name: "empty string", when: "", selected: false },
    { name: "nonempty string", when: "ready", selected: true },
    { name: "object", when: {}, selected: true },
    { name: "empty array", when: [], selected: false },
    { name: "all-truthy array", when: [true, 1], selected: true },
    { name: "array with a falsy member", when: [true, 0], selected: false },
  ])("OptionalWrapper: $name condition -> invokes only the selected wrapper", ({ when, selected }) => {
    const child = <span>content</span>;
    const wrapper = vi.fn((content: ReactNode) => <strong>{content}</strong>);
    const elseWrapper = vi.fn((content: ReactNode) => <em>{content}</em>);
    const fallback = vi.fn((content: ReactNode) => <small>{content}</small>);

    const { container } = render(
      <OptionalWrapper when={when} wrapper={wrapper} elseWrapper={elseWrapper} fallback={fallback}>
        {child}
      </OptionalWrapper>,
    );

    expect(wrapper).toHaveBeenCalledTimes(selected ? 1 : 0);
    expect(elseWrapper).toHaveBeenCalledTimes(selected ? 0 : 1);
    expect(selected ? wrapper : elseWrapper).toHaveBeenCalledWith(child);
    expect(fallback).not.toHaveBeenCalled();
    expect(container.firstElementChild?.tagName).toBe(selected ? "STRONG" : "EM");
  });

  it.each(["wrapper", "elseWrapper", "fallback", "none"] as const)(
    "OptionalWrapper: %s selected -> preserves child events and ref",
    (selected) => {
      const ref = createRef<HTMLButtonElement>();
      const onClick = vi.fn();
      const child = <button ref={ref} onClick={onClick}>Child</button>;
      const transform = vi.fn((content: ReactNode) => <section>{content}</section>);
      const inactive = () => { throw new Error("Inactive wrapper executed"); };

      const rendered = render(
        <OptionalWrapper
          when={selected === "wrapper"}
          wrapper={selected === "wrapper" ? transform : inactive}
          elseWrapper={selected === "elseWrapper" ? transform : undefined}
          fallback={selected === "fallback" ? transform : undefined}
        >
          {child}
        </OptionalWrapper>,
      );

      const button = screen.getByRole("button", { name: "Child" });
      expect(ref.current).toBe(button);
      if (selected === "none") {
        expect(transform).not.toHaveBeenCalled();
        expect(rendered.container.firstElementChild).toBe(button);
      } else {
        expect(transform).toHaveBeenCalledExactlyOnceWith(child);
      }
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
      rendered.unmount();
      expect(ref.current).toBeNull();
    },
  );

  it.each([null, false, 0])(
    "OptionalWrapper: selected elseWrapper returns %s -> preserves result without invoking fallback",
    (result) => {
      const wrapper = vi.fn(() => <strong>inactive</strong>);
      const elseWrapper = vi.fn(() => result);
      const fallback = vi.fn(() => <small>fallback</small>);

      const { container } = render(
        <OptionalWrapper when={false} wrapper={wrapper} elseWrapper={elseWrapper} fallback={fallback}>
          content
        </OptionalWrapper>,
      );

      expect(container.textContent).toBe(result === 0 ? "0" : "");
      expect(elseWrapper).toHaveBeenCalledTimes(1);
      expect(wrapper).not.toHaveBeenCalled();
      expect(fallback).not.toHaveBeenCalled();
    },
  );

  it("OptionalWrapper: truthy branch selected -> does not evaluate a throwing elseWrapper", () => {
    const child = <span>content</span>;
    const elseWrapper = () => { throw new Error("Inactive elseWrapper executed"); };

    const { container } = render(
      <OptionalWrapper when={true} wrapper={(content) => <strong>{content}</strong>} elseWrapper={elseWrapper}>
        {child}
      </OptionalWrapper>,
    );

    expect(container.querySelector("strong")?.textContent).toBe("content");
  });

  it("wraps with wrapper when true and elseWrapper when false", () => {
    const { rerender, container } = render(
      <OptionalWrapper
        when={true}
        wrapper={(c) => <strong>{c}</strong>}
        elseWrapper={(c) => <em>{c}</em>}
      >
        hi
      </OptionalWrapper>,
    );
    expect(container.querySelector("strong")?.textContent).toBe("hi");

    rerender(
      <OptionalWrapper
        when={false}
        wrapper={(c) => <strong>{c}</strong>}
        elseWrapper={(c) => <em>{c}</em>}
      >
        hi
      </OptionalWrapper>,
    );
    expect(container.querySelector("em")?.textContent).toBe("hi");
  });

  it("falls back to the deprecated fallback alias", () => {
    const { container } = render(
      <OptionalWrapper when={false} wrapper={(c) => <strong>{c}</strong>} fallback={(c) => <em>{c}</em>}>
        hi
      </OptionalWrapper>,
    );
    expect(container.querySelector("em")?.textContent).toBe("hi");
  });
});

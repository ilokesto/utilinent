import { StrictMode } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollLock } from "../../src/index";

describe("ScrollLock", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    document.body.removeAttribute("style");
    vi.restoreAllMocks();
  });

  it("ScrollLock: omitted when -> locks after mount without rendering DOM", () => {
    const rendered = render(<ScrollLock />);

    expect(rendered.container).toBeEmptyDOMElement();
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.overflowY).toBe("hidden");
  });

  it("ScrollLock: false then true then false -> acquires and restores the lock", () => {
    const rendered = render(<ScrollLock when={false} />);
    expect(document.body.style.position).toBe("");

    rendered.rerender(<ScrollLock when />);
    expect(document.body.style.position).toBe("fixed");

    rendered.rerender(<ScrollLock when={false} />);
    expect(document.body.style.position).toBe("");
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it("ScrollLock: nested owners release out of order -> only last release restores", () => {
    const first = render(<ScrollLock />);
    const second = render(<ScrollLock />);
    const third = render(<ScrollLock />);

    second.unmount();
    first.unmount();

    expect(document.body.style.position).toBe("fixed");
    expect(window.scrollTo).not.toHaveBeenCalled();

    third.unmount();
    expect(document.body.style.position).toBe("");
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it("ScrollLock: existing styles and scroll -> restores exact values and priorities", () => {
    const original = [
      ["position", "relative", "important"],
      ["top", "7px", ""],
      ["left", "9%", "important"],
      ["width", "83%", ""],
      ["overflow-x", "scroll", "important"],
      ["overflow-y", "auto", ""],
    ];
    for (const [property, value, priority] of original) {
      document.body.style.setProperty(property, value, priority);
    }
    vi.spyOn(window, "scrollX", "get").mockReturnValue(31);
    vi.spyOn(window, "scrollY", "get").mockReturnValue(240);
    const rendered = render(<ScrollLock />);
    expect(document.body.style.top).toBe("-240px");
    expect(document.body.style.left).toBe("-31px");
    expect(document.body.style.getPropertyPriority("position")).toBe("important");
    document.body.style.setProperty("color", "red", "important");

    rendered.unmount();

    for (const [property, value, priority] of original) {
      expect(document.body.style.getPropertyValue(property)).toBe(value);
      expect(document.body.style.getPropertyPriority(property)).toBe(priority);
    }
    expect(document.body.style.getPropertyValue("color")).toBe("red");
    expect(document.body.style.getPropertyPriority("color")).toBe("important");
    expect(window.scrollTo).toHaveBeenCalledWith({ left: 31, top: 240, behavior: "instant" });
  });

  it("ScrollLock: unrelated rerender while locked -> retains the original snapshot", () => {
    const rendered = render(<ScrollLock />);

    rendered.rerender(<ScrollLock when />);

    expect(window.scrollTo).not.toHaveBeenCalled();
    rendered.unmount();
    expect(document.body.style.position).toBe("");
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it("ScrollLock: ownerDocument changes with another owner -> releases only its old ownership", () => {
    const otherDocument = document.implementation.createHTMLDocument();
    const first = render(<ScrollLock />);
    const second = render(<ScrollLock />);

    first.rerender(<ScrollLock ownerDocument={otherDocument} />);

    expect(document.body.style.position).toBe("fixed");
    expect(otherDocument.body.style.position).toBe("fixed");
    expect(window.scrollTo).not.toHaveBeenCalled();

    second.unmount();
    expect(document.body.style.position).toBe("");
    expect(otherDocument.body.style.position).toBe("fixed");
    first.unmount();
    expect(otherDocument.body.style.position).toBe("");
  });

  it("ScrollLock: iframe ownerDocument -> restores only that window's scroll", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    const frameWindow = frame.contentWindow!;
    const scrollTo = vi.spyOn(frameWindow, "scrollTo").mockImplementation(() => undefined);
    vi.spyOn(frameWindow, "scrollY", "get").mockReturnValue(86);
    const rendered = render(<ScrollLock ownerDocument={frameDocument} />);
    expect(document.body.style.position).toBe("");
    expect(frameDocument.body.style.top).toBe("-86px");

    rendered.unmount();

    expect(scrollTo).toHaveBeenCalledWith({ left: 0, top: 86, behavior: "instant" });
    expect(window.scrollTo).not.toHaveBeenCalled();
    frame.remove();
  });

  it("ScrollLock: target without a body -> remains inert", () => {
    const target = document.implementation.createHTMLDocument();
    target.body.remove();
    const rendered = render(<ScrollLock ownerDocument={target} />);

    rendered.unmount();

    expect(document.body.style.position).toBe("");
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("ScrollLock: StrictMode replay with a surviving owner -> preserves lock and balanced cleanup", () => {
    document.body.style.setProperty("position", "relative", "important");
    const survivor = render(<ScrollLock />);
    const replayed = render(<StrictMode><ScrollLock /></StrictMode>);

    survivor.unmount();

    expect(document.body.style.position).toBe("fixed");
    expect(window.scrollTo).not.toHaveBeenCalled();
    replayed.unmount();
    expect(document.body.style.position).toBe("relative");
    expect(document.body.style.getPropertyPriority("position")).toBe("important");
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it("ScrollLock: StrictMode as sole owner -> restores absent owned properties after unmount", () => {
    const rendered = render(<StrictMode><ScrollLock /></StrictMode>);
    expect(document.body.style.position).toBe("fixed");

    rendered.unmount();

    for (const property of ["position", "top", "left", "width", "overflow-x", "overflow-y"]) {
      expect(document.body.style.getPropertyValue(property)).toBe("");
      expect(document.body.style.getPropertyPriority(property)).toBe("");
    }
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
  });
});

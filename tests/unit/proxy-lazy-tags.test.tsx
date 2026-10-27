import { render } from "@testing-library/react";
import { createRef, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { htmlTags } from "../../src/constants/htmlTags";
import { createProxy } from "../../src/core/createProxy";
import { createTagRenderer } from "../../src/core/createTagRenderer";
import { PluginManager } from "../../src/core/PluginManager";

type TagWrapper = ReturnType<ReturnType<typeof createTagRenderer>>;

type TestProxy = {
  Probe: TagWrapper;
  section: TagWrapper;
  button: TagWrapper;
  em: TagWrapper;
  div?: TagWrapper;
};

/**
 * Builds a proxy over an empty base whose `renderForTag` factory records
 * every invocation, so tests can assert when tag wrappers are allocated.
 */
function createCountingProxy() {
  const factoryCalls: string[] = [];
  const renderForTag = createTagRenderer(
    ({ children }: { children?: ReactNode }) => children,
    ["children"],
  );
  const countingFactory = (tag: React.ElementType) => {
    factoryCalls.push(String(tag));
    return renderForTag(tag);
  };
  const proxy = createProxy<TestProxy, object>({}, countingFactory, "show");
  return { proxy, factoryCalls };
}

afterEach(() => {
  for (const category of ["show", "base"] as const) {
    PluginManager.unregister(category, "Probe");
    PluginManager.unregister(category, "div");
  }
});

describe("lazy HTML tag wrappers", () => {
  it("createProxy: no property access -> renderForTag is never invoked", () => {
    // Arrange
    const { factoryCalls } = createCountingProxy();

    // Assert
    expect(factoryCalls).toEqual([]);
  });

  it("createProxy: repeated same-tag access -> tag wrapper is created exactly once", () => {
    // Arrange
    const { proxy, factoryCalls } = createCountingProxy();

    // Act
    void proxy.section;
    void proxy.section;
    void proxy.section;

    // Assert
    expect(factoryCalls).toEqual(["section"]);
  });

  it("createProxy: same tag accessed repeatedly -> returns the cached wrapper identity", () => {
    // Arrange
    const { proxy } = createCountingProxy();

    // Act
    const first = proxy.section;
    const second = proxy.section;

    // Assert
    expect(second).toBe(first);
  });

  it("createProxy: tag access after unrelated plugin access -> creates only the requested tag", () => {
    // Arrange
    PluginManager.register({ show: { Probe: "section" } });
    const { proxy, factoryCalls } = createCountingProxy();

    // Act
    void proxy.Probe;
    void proxy.div;

    // Assert
    expect(factoryCalls).toEqual(["section", "div"]);
  });

  it("proxy tag wrappers: rendered output -> forwards props, children and ref to the tag", () => {
    // Arrange
    const { proxy } = createCountingProxy();
    const ref = createRef<HTMLButtonElement>();

    // Act
    const { container } = render(
      <proxy.button ref={ref} title="confirm">
        save
      </proxy.button>,
    );

    // Assert
    expect(container.innerHTML).toBe('<button title="confirm">save</button>');
    expect(ref.current).toBe(container.firstElementChild);
  });

  it("in operator: unaccessed tag -> reports true without creating the wrapper", () => {
    // Arrange
    const { proxy, factoryCalls } = createCountingProxy();

    // Act
    const hasSpan = "span" in proxy;

    // Assert
    expect(hasSpan).toBe(true);
    expect(factoryCalls).toEqual([]);
  });

  it("Object.keys: enumeration -> still lists every HTML tag name", () => {
    // Arrange
    const { proxy } = createCountingProxy();

    // Act
    const keys = Object.keys(proxy);

    // Assert
    expect(keys).toEqual(Object.keys(htmlTags));
  });

  it("getOwnPropertyDescriptor: first tag descriptor request -> returns complete descriptor matching property access", () => {
    // Arrange
    const { proxy, factoryCalls } = createCountingProxy();

    // Act
    const descriptor = Object.getOwnPropertyDescriptor(proxy, "em");

    // Assert
    expect(descriptor).toMatchObject({
      value: proxy.em,
      enumerable: true,
      writable: true,
      configurable: true,
    });
    expect(factoryCalls).toEqual(["em"]);
  });

  it("delete on tag slot: after deletion -> behaves like a deleted own property", () => {
    // Arrange
    const { proxy } = createCountingProxy();
    expect(proxy.div).toBeDefined();

    // Act
    const deleted = delete proxy.div;

    // Assert
    expect(deleted).toBe(true);
    expect(proxy.div).toBeUndefined();
    expect("div" in proxy).toBe(false);
  });

  it("plugin cache lifetime: plugin unregistered after access -> proxy keeps the cached wrapper", () => {
    // Arrange
    PluginManager.register({ show: { Probe: "section" } });
    const { proxy } = createCountingProxy();
    const cached = proxy.Probe;

    // Act
    PluginManager.unregister("show", "Probe");

    // Assert
    expect(proxy.Probe).toBe(cached);
  });
});

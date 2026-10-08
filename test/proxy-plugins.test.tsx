import { render } from "@testing-library/react";
import { createRef, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createProxy } from "../src/core/createProxy";
import { createTagRenderer } from "../src/core/createTagRenderer";
import { PluginManager } from "../src/core/PluginManager";

const renderForTag = createTagRenderer(
  ({ children }: { children?: ReactNode }) => children,
  ["children"],
);

function createTestProxy() {
  return createProxy<{
    Probe: ReturnType<typeof renderForTag>;
    div: ReturnType<typeof renderForTag>;
  }, object>({}, renderForTag, "show");
}

afterEach(() => {
  for (const category of ["show", "base"] as const) {
    PluginManager.unregister(category, "Probe");
    PluginManager.unregister(category, "div");
  }
});

describe("proxy plugin resolution", () => {
  it("prefers category plugins over base plugins", () => {
    PluginManager.register({
      show: { Probe: "section" },
      base: { Probe: "article" },
    });
    const proxy = createTestProxy();

    const { container } = render(<proxy.Probe>content</proxy.Probe>);

    expect(container.innerHTML).toBe("<section>content</section>");
  });

  it("renders base fallback plugins and forwards their props and ref", () => {
    PluginManager.register({ base: { Probe: "article" } });
    const proxy = createTestProxy();
    const ref = createRef<HTMLElement>();

    const { container } = render(
      <proxy.Probe ref={ref} title="fallback">content</proxy.Probe>,
    );

    expect(container.innerHTML).toBe('<article title="fallback">content</article>');
    expect(ref.current).toBe(container.firstElementChild);
  });

  it("keeps built-in tag properties ahead of registered plugins", () => {
    PluginManager.register({ show: { div: "section" } });
    const proxy = createTestProxy();

    const { container } = render(<proxy.div>content</proxy.div>);

    expect(container.innerHTML).toBe("<div>content</div>");
  });

  it("caches resolved plugins on each proxy without sharing cached components", () => {
    PluginManager.register({ show: { Probe: "section" } });
    const proxy = createTestProxy();
    const original = proxy.Probe;
    PluginManager.register({ show: { Probe: "article" } });
    const freshProxy = createTestProxy();

    const { container } = render(
      <><proxy.Probe>old</proxy.Probe><freshProxy.Probe>new</freshProxy.Probe></>,
    );

    expect(proxy.Probe).toBe(original);
    expect(freshProxy.Probe).not.toBe(original);
    expect(container.innerHTML).toBe("<section>old</section><article>new</article>");
  });

  it("resolves a plugin registered after a missing lookup", () => {
    const proxy = createTestProxy();
    expect(proxy.Probe).toBeUndefined();
    PluginManager.register({ show: { Probe: "section" } });

    const { container } = render(<proxy.Probe>late</proxy.Probe>);

    expect(container.innerHTML).toBe("<section>late</section>");
  });

  it("returns undefined for unregistered string and symbol properties", () => {
    const proxy = createTestProxy();

    const missing = [Reflect.get(proxy, "Missing"), Reflect.get(proxy, Symbol("Missing"))];

    expect(missing).toEqual([undefined, undefined]);
  });
});

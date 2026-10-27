import { describe, expect, it, vi } from "vitest";

/**
 * Counts every `forwardRef` call that happens while proxy component modules
 * are evaluated. Tag wrappers are the only `forwardRef` consumers in these
 * modules, so the counter measures tag wrapper allocation at import time.
 */
const tagWrapperCreations = vi.hoisted(() => ({ count: 0 }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    forwardRef: (render: never) => {
      tagWrapperCreations.count += 1;
      return actual.forwardRef(render);
    },
  };
});

describe("lazy HTML tag wrappers at module evaluation", () => {
  it("proxy modules: imported without tag access -> zero tag wrappers created", async () => {
    // Arrange: importing each polymorphic component module evaluates its
    // createProxy call, which previously pre-allocated a wrapper per HTML tag.
    await import("../../src/components/Show");
    await import("../../src/components/For");
    await import("../../src/components/Mount");
    await import("../../src/components/Repeat");
    await import("../../src/components/Switch/Switch");

    // Assert
    expect(tagWrapperCreations.count).toBe(0);
  });
});

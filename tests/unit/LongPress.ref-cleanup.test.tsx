import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { LongPress } from "../../src";

it("LongPress: React 19 callback ref returns cleanup -> calls the cleanup on unmount", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const { unmount, getByRole } = render(<LongPress ref={ref}>Hold</LongPress>);
  expect(ref).toHaveBeenCalledExactlyOnceWith(getByRole("button"));

  unmount();

  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(ref).toHaveBeenCalledTimes(1);
});

// @vitest-environment node
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { ScrollLock } from "../../src/index";

it("ScrollLock: server without DOM globals -> renders nothing without accessing document", () => {
  const html = renderToString(<ScrollLock />);

  expect(html).toBe("");
});

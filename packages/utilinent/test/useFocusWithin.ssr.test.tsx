// @vitest-environment node
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { useFocusWithin } from "../src/hooks";

it("useFocusWithin: server without DOM globals -> renders initial false", () => {
  function Probe() {
    const { ref, isFocusWithin } = useFocusWithin();
    return <div ref={ref}>{String(isFocusWithin)}</div>;
  }

  const html = renderToString(<Probe />);

  expect(html).toBe("<div>false</div>");
});

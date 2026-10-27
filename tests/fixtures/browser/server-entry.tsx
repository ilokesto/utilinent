import { renderToString } from "react-dom/server";
import { HarnessApp } from "./HarnessApp";

export function render(route: string) {
  return renderToString(<HarnessApp route={route} />);
}

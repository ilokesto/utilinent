import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { ScrollLock } from "../../../src/components/ScrollLock";

declare global {
  interface Window {
    scrollLockFixture: {
      lock: (first: boolean, second: boolean) => void;
      unmount: () => void;
    };
  }
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Missing ScrollLock fixture root");
}
const root = createRoot(container);
window.scrollLockFixture = {
  lock(first, second) {
    flushSync(() => root.render(
      <StrictMode>
        <ScrollLock when={first} />
        <ScrollLock when={second} />
      </StrictMode>,
    ));
    void window.reportSignal({ kind: "scroll-lock-state", value: first || second });
  },
  unmount() {
    flushSync(() => root.unmount());
    void window.reportSignal({ kind: "scroll-lock-unmounted", value: true });
  },
};
window.scrollLockFixture.lock(false, false);

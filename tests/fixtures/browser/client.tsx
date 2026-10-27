import { version } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { HarnessApp, report } from "./HarnessApp";
import type { Signal } from "./HarnessApp";

declare global {
  interface Window {
    reportSignal: (signal: Signal) => Promise<void>;
    harness: {
      signals: Signal[];
      hydrate: () => void;
      unmount: () => void;
      settle: (failure?: boolean) => Promise<void>;
      resources: () => { listeners: number; targets: number; timers: number };
    };
  }
}

// Observe ownership without replacing native event delivery or geometry.
const listeners = new Map<EventTarget, Set<EventListenerOrEventListenerObject>>();
const nativeAdd = EventTarget.prototype.addEventListener;
const nativeRemove = EventTarget.prototype.removeEventListener;
function tracked(target: EventTarget, type: string) {
  return (target === document && type === "visibilitychange") ||
    (target instanceof HTMLElement && target.id === "focus-group" &&
      (type === "focusin" || type === "focusout"));
}
EventTarget.prototype.addEventListener = function(type, callback, options) {
  if (callback && tracked(this, type)) {
    const callbacks = listeners.get(this) ?? new Set();
    callbacks.add(callback);
    listeners.set(this, callbacks);
  }
  nativeAdd.call(this, type, callback, options);
};
EventTarget.prototype.removeEventListener = function(type, callback, options) {
  if (callback && tracked(this, type)) {
    listeners.get(this)?.delete(callback);
  }
  nativeRemove.call(this, type, callback, options);
};
const observations = new Map<IntersectionObserver, Set<Element>>();
const NativeObserver = window.IntersectionObserver;
window.IntersectionObserver = class extends NativeObserver {
  observe(target: Element) {
    const targets = observations.get(this) ?? new Set();
    targets.add(target);
    observations.set(this, targets);
    super.observe(target);
  }
  unobserve(target: Element) { observations.get(this)?.delete(target); super.unobserve(target); }
  disconnect() { observations.delete(this); super.disconnect(); }
};
const timers = new Set<number>();
const browserWindow: Window = window;
const nativeTimeout = browserWindow.setTimeout.bind(window);
const nativeClear = browserWindow.clearTimeout.bind(window);
browserWindow.setTimeout = (handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
  if (typeof handler !== "function") { return nativeTimeout(handler, timeout, ...args); }
  const id = nativeTimeout(() => {
    timers.delete(id);
    handler(...args);
  }, timeout);
  timers.add(id);
  return id;
};
browserWindow.clearTimeout = (id?: number) => {
  if (id !== undefined) { timers.delete(id); }
  nativeClear(id);
};

let root: Root | undefined;
window.harness = {
  signals: [],
  hydrate() {
    const container = document.getElementById("root");
    if (!container) { throw new Error("Missing SSR root"); }
    root = hydrateRoot(container, <HarnessApp route={location.pathname} />, {
      onRecoverableError: error => report("hydration-error", String(error)),
    });
  },
  unmount() {
    flushSync(() => root?.unmount());
    report("unmounted", true);
  },
  async settle() { throw new Error("No consumer task attached"); },
  resources: () => ({
    listeners: [...listeners.values()].reduce((sum, callbacks) => sum + callbacks.size, 0),
    targets: [...observations.values()].reduce((sum, targets) => sum + targets.size, 0),
    timers: timers.size,
  }),
};
document.addEventListener("focusin", event => {
  report("native-focus", event.target instanceof HTMLElement ? event.target.id : null);
});
report("ready", version);

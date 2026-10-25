import { Show } from "../src/components/Show";
import { createProxy } from "../src/core/createProxy";
import { createTagRenderer } from "../src/core/createTagRenderer";

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function lazySample({ iterations, targets }) {
  let factoryCalls = 0;
  const render = createTagRenderer(({ children }) => children, ["children"]);
  const start = performance.now();
  const proxies = Array.from({ length: iterations }, () => createProxy(
    () => null,
    (tag) => {
      factoryCalls += 1;
      return render(tag);
    },
    "show",
  ));
  const created = performance.now();
  const beforeAccess = factoryCalls;
  const wrappers = proxies.map((proxy) => proxy.div);
  const firstAccess = performance.now();
  const afterFirstAccess = factoryCalls;
  let stable = true;
  for (let repeat = 0; repeat < targets; repeat += 1) {
    for (let index = 0; index < proxies.length; index += 1) {
      stable = stable && proxies[index].div === wrappers[index];
    }
  }
  const end = performance.now();
  check(beforeAccess === 0, "Proxy construction eagerly created wrappers");
  check(afterFirstAccess === iterations && factoryCalls === iterations, "Repeated access allocated wrappers");
  check(stable && new Set(wrappers).size === iterations && Show.div === Show.div, "Wrapper identity changed");
  return {
    proxyCount: iterations,
    cachedReads: iterations * targets,
    wrappersBeforeAccess: beforeAccess,
    wrappersAfterFirstAccess: afterFirstAccess,
    wrappersAfterCachedReads: factoryCalls,
    stableIdentity: stable,
    createProxyMs: created - start,
    firstAccessMs: firstAccess - created,
    cachedAccessMs: end - firstAccess,
  };
}

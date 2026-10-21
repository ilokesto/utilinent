import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Mixed React 19 ref-return suites stay intact in the normal runtime.
    // Their React 18 contracts live in the dedicated compatibility spec.
    include: [
      "test/core-fixes.test.tsx",
      "test/DelayedFallback.test.tsx",
      "test/intersectionObserverPool.test.tsx",
      "test/Mount.test.tsx",
      "test/new-components.test.tsx",
      "test/new-hooks.test.tsx",
      "test/observerGeneration.test.tsx",
      "test/observerSubscription.test.tsx",
      "test/proxy-lazy-tags.module.test.tsx",
      "test/proxy-lazy-tags.test.tsx",
      "test/proxy-plugins.test.tsx",
      "test/Runtime.test.tsx",
      "test/Show.test.tsx",
      "test/Slacker.test.tsx",
      "test/useEventListener.test.tsx",
      "test/useFocusWithin.ssr.test.tsx",
      "test/useFocusWithin.test.tsx",
      "test/useInfiniteSentinel.test.tsx",
      "test/useIntersectionObserver.test.tsx",
      "test/useMediaQuery.test.tsx",
      "test/usePageVisibility.test.tsx",
      "test/usePendingDelay.test.tsx",
      "test/react18-compatibility.spec.tsx",
    ],
    setupFiles: ["./test/setup.ts"],
  },
});

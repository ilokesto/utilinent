import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Mixed React 19 ref-return suites stay intact in the normal runtime.
    // Their React 18 contracts live in the dedicated compatibility spec.
    include: [
      "tests/unit/core-fixes.test.tsx",
      "tests/unit/DelayedFallback.test.tsx",
      "tests/unit/intersectionObserverPool.test.tsx",
      "tests/unit/Mount.test.tsx",
      "tests/unit/new-components.test.tsx",
      "tests/unit/new-hooks.test.tsx",
      "tests/unit/observerGeneration.test.tsx",
      "tests/unit/observerSubscription.test.tsx",
      "tests/unit/proxy-lazy-tags.module.test.tsx",
      "tests/unit/proxy-lazy-tags.test.tsx",
      "tests/unit/proxy-plugins.test.tsx",
      "tests/unit/Runtime.test.tsx",
      "tests/unit/Show.test.tsx",
      "tests/unit/Slacker.test.tsx",
      "tests/unit/useEventListener.test.tsx",
      "tests/unit/useFocusWithin.ssr.test.tsx",
      "tests/unit/useFocusWithin.test.tsx",
      "tests/unit/useInfiniteSentinel.test.tsx",
      "tests/unit/useIntersectionObserver.test.tsx",
      "tests/unit/useMediaQuery.test.tsx",
      "tests/unit/usePageVisibility.test.tsx",
      "tests/unit/usePendingDelay.test.tsx",
      "tests/unit/react18-compatibility.spec.tsx",
    ],
    setupFiles: ["./tests/fixtures/setup.ts"],
  },
});

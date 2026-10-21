---
"@ilokesto/utilinent": patch
---

Stabilize `useIntersectionObserver` and `Observer` subscriptions.

- Normalize thresholds by value set, so a fresh-but-equal inline `threshold` array no longer recreates the native observer on every record; reordered and duplicated values are equivalent, and only real value changes replace the observation.
- Share one native `IntersectionObserver` between subscriptions with the same root identity, `rootMargin`, and normalized thresholds. Records route per target, freezing or unsubscribing one target stops only that target, and the final unsubscribe disconnects the shared observer and clears its registry entry.
- Scope `freezeOnceVisible` to the observed target: removing, swapping, or reattaching the target resets the frozen state and re-observes from scratch, and turning the option off resumes observation instead of leaving the hook permanently unobserved.
- Subscribe `Observer` to the intersection boolean only, so same-boolean records no longer re-render it. `useIntersectionObserver` keeps updating `entry` on every record for ratio/coordinate consumers, and the documented render-prop children form now typechecks.

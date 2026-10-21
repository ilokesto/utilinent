---
"@ilokesto/utilinent": minor
---

Pass an AbortSignal to `Mount` factories and `Slacker` loaders. Each attempt owns a fresh controller: replacing `children`/`loader`, unmounting, and superseding a failed retry abort the previous signal, while zero-argument functions keep working unchanged and the existing stale-result guards stay in place. AbortErrors from already-aborted attempts are dropped silently (no `onError`, no retry, no console noise); AbortErrors surfacing from the live attempt remain ordinary failures.

Document the function-identity restart contract with stable `useCallback` examples for `Mount` and `Slacker` in English and Korean, including the `onError` restart behavior. Add large-list lifespan guidance distinguishing lazy loading from virtualization or cache eviction, with a pagination example that bounds actually mounted rows without introducing a virtualization engine.

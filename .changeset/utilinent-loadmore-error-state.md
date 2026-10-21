---
"@ilokesto/utilinent": minor
---

Add `isError` to `useInfiniteSentinel` results and `LoadMore` render state so every failure, including rejection with `undefined`, `null`, an empty string, `false`, or `0`, can be distinguished from success. Preserve the original `unknown` error reason and clear failure state only when an eligible new attempt starts.

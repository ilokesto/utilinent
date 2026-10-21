---
"@ilokesto/utilinent": minor
---

Add `usePendingDelay` and the polymorphic `DelayedFallback` component to prevent
brief loading flashes with a reveal delay and minimum visible duration. Preserve
continuous visibility across restarted requests, recalculate changed timing
options from phase start times, and clean up timers on unmount.

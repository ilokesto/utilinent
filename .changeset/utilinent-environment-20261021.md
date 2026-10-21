---
"@ilokesto/utilinent": patch
---

Fix `useMediaQuery` hydration: the first client render now uses the same `false` snapshot as the server and synchronizes to the actual media match in a layout effect before the first paint, removing recoverable hydration errors when server and client media states differ. Query replacement and change-listener cleanup behavior are unchanged, and `Media` documents the matching SSR contract.

Fix `useEventListener` ref target tracking: listeners now follow the DOM node a `RefObject` points to when the node mounts later, is swapped to a different node, or the ref is cleared to `null`, detaching from the previous node. Handler-only updates keep the no-rebind contract and `disabled`/`capture`/`passive` changes keep re-binding with cleanup.

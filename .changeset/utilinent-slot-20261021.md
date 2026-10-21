---
"@ilokesto/utilinent": patch
---

Clarify the Slot children contract: development-mode warnings for multiple children and non-element children, and preserve Slottable siblings when the slotted child is invalid instead of rendering nothing.

Keep Slot's composed ref referentially stable while the forwarded ref and the child ref keep their identity, avoiding redundant ref detach/attach cycles and cleanup re-runs on rerenders across both the plain Slot and Slottable paths.

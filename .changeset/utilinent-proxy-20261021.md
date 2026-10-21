---
"@ilokesto/utilinent": patch
---

Create HTML tag wrappers for polymorphic proxies on first access instead of pre-allocating a wrapper for every known tag at proxy creation, so importing the package no longer creates 425 tag wrappers (85 tags × 5 polymorphic proxies) at module evaluation.

Reflection keeps reporting tags as own properties: `in` checks succeed without allocating, `Object.keys` and `for...in` still list every tag, and `Object.getOwnPropertyDescriptor` materializes the wrapper so its value matches property access. Repeated reads of the same tag return the cached wrapper identity, and tag-over-plugin priority plus cached-plugin lifetime are unchanged.

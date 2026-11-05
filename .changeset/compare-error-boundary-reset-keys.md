---
"@ilokesto/utilinent": patch
---

Compare ErrorBoundary reset keys by length and Object.is values instead of array identity. Treat absent keys as an empty array and avoid immediately retrying a newly caught error when keys change.

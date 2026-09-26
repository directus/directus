---
'@directus/sdk': patch
---

Fixed `createItem`, `createItems`, `updateItem`, and `updateItems` rejecting valid input for fields typed with the `json`, `datetime`, `date`, or `time` literal type markers, and fixed `updateItem` and `updateSingleton` not type-checking the payload against the collection's item type

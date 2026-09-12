---
'@directus/sdk': patch
---

Fixed `createItem`, `createItems`, `updateItem`, and `updateItems` rejecting valid input for fields typed with a literal type marker (`json`, `csv`, `datetime`, `date`, `time`). Write payloads now accept the same values reads return (for example a date string for a `datetime` field, or an object for a `json` field) instead of the literal marker itself.

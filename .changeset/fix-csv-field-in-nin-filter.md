---
'@directus/api': patch
---

Fixed `_in` and `_nin` filter operators on CSV fields to match each value as a discrete entry rather than performing a whole-column comparison, which previously caused multi-value filters to miss rows whose CSV contained more than one entry

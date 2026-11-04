---
'@directus/app': patch
---

Improved table performance by only re-rendering rows whose own data changed, instead of every row on each table update or column resize. Table cells now show `0` and `false` instead of `--`. Extensions that use `v-table` item slots should read changing data from the slot's `item` or from reactive state, since a value captured from a surrounding `v-for` or slot no longer re-renders the row

---
'@directus/app': patch
---

Improved table performance by only re-rendering rows whose own data changed, instead of every row on each table update or column resize. Table cells now show `0` and `false` instead of `--`. In rare cases, an extension's custom `v-table` cell can keep showing old content: when the slot reads a value captured from a surrounding `v-for` or slot, or when the parent swaps between two versions of the same slot with `v-if`/`v-else`. Read changing data from the slot's `item` or from reactive state instead

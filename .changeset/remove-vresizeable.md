---
'@directus/app': major
---

Removed the `VResizeable` component @formfcw

::: notice

- Breaking change for extensions: The globally registered `VResizeable` component has been removed. Extension authors using `<v-resizeable>` must replace it with `@directus/vue-split-panel` or their own implementation.

:::

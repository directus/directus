---
'@directus/types': major
'@directus/themes': major
---

Refactored drawer header layout and simplified v-drawer API.

:::notice

- **Potential Breaking change for extensions:** The `v-breadcrumb` component has been removed.
- **Potential Breaking change for extensions:** The `subtitle` prop, `headline` slot, and `header:append` slot on `v-drawer` have been removed, and the `actions` slot has been renamed to `actions:primary`.
- **Potential Breaking change for extensions:** The theme properties `header.headline.foreground` and `header.headline.fontFamily` have been removed. Custom themes overriding these properties should remove them. The corresponding CSS variables `--theme--header--headline--foreground` and `--theme--header--headline--font-family` no longer exist.

:::

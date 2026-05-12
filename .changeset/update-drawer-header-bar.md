---
'@directus/types': major
'@directus/themes': major
---

Refactored drawer header layout and simplified v-drawer API @formfcw

:::notice

- Deprecation for extensions: The globally registered `v-breadcrumb` component has been deprecated. Extensions using `<v-breadcrumb>` keep rendering but will see a deprecation hint from Volar.
- Deprecation for extensions: On `v-drawer`, the `subtitle` prop (use the `title` prop instead), the `subtitle` slot, the `header:append` slot, and the `actions:append` slot have been deprecated. Existing usage keeps rendering — `actions:append` content lands in the secondary-actions zone, and for primary CTAs in the drawer header use the new `actions:primary` slot. Consumers will see deprecation hints from Volar.
- Potential Breaking change for theme extensions: The theme properties `header.headline.foreground` and `header.headline.fontFamily` have been removed. Custom themes overriding these properties should remove them. The corresponding CSS variables `--theme--header--headline--foreground` and `--theme--header--headline--font-family` no longer exist.

:::

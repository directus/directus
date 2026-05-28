---
'@directus/app': minor
---

Refactored header bar action slots and reorganized CTAs @formfcw

:::notice

- Deprecation for extensions: The `actions:append` slot in the header bar has been deprecated in favor of the new `actions:primary` slot for primary CTAs. Existing `actions:append` usage keeps rendering in the secondary-actions zone, but consumers will now see a deprecation hint from Volar.

:::

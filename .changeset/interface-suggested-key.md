---
'@directus/types': minor
'@directus/app': minor
---

Added an optional `suggestedKey` option to `InterfaceConfig`, letting interface extensions pre-fill the field key with a conventional value when the interface is selected during field creation. The suggestion is only applied while the key is still empty and never overwrites a key the user entered.

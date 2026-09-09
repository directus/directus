---
'@directus/api': patch
---

Fixed `redactObject` dropping an unmatched key path when two paths matched the same key, which left that path's value unredacted

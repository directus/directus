---
'@directus/api': patch
---

Fixed `redactObject` skipping a key path when an earlier path matched the same key, which could leave that value unredacted

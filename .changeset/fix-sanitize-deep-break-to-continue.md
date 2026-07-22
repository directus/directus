---
'@directus/api': patch
---

Fix `sanitizeDeep` silently dropping relation keys after an empty string key — `break` replaced with `continue` so only the empty key is skipped instead of aborting the entire loop

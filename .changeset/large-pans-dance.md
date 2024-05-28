---
"@directus/api": patch
---

Fixed an issue where calling `/random/string` with an invalid length param could prevent creation of valid sessions until next restart

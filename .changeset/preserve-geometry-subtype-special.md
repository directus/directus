---
"@directus/app": patch
---

Fixed geometry fields losing their subtype (e.g. `Point` becoming `Geometry (Any)`) when changing an unrelated schema option such as Allow NULL

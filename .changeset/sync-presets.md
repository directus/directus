---
'@directus/cli': minor
---

Added presets to Environment Sync. Global and role-scoped bookmarks and default views are synced; personal presets stay on their instance, and role presets whose role is missing on the target are skipped with a warning. Fixed add-mode pushes silently skipping a new permission whose source ID matched an unrelated target record

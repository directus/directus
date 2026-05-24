---
'@directus/app': patch
---

Fixed translation form WYSIWYG editor race condition and crash under non-admin roles with per-row update permissions by unmounting and remounting the form during permissions loading state

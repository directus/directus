---
'@directus/app': patch
---

Fixed TUS upload null ID bug where `onAfterResponse` would assign `null` to `fileInfo.id` when the `Directus-File-Id` header was missing, causing "invalid input syntax for type uuid: null" errors on retry/resume.

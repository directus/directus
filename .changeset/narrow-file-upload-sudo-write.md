---
'@directus/api': patch
---

Fixed `FilesService.uploadOne` to prevent client payloads from overwriting system fields (e.g., `uploaded_by`, `created_on` etc)

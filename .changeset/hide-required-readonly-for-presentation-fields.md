---
'@directus/app': patch
---

Hide "required" and "readonly" toggles for presentation fields in the field settings UI, since presentation fields don't store values and these options can cause validation errors.
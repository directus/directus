---
'@directus/validation': patch
---

Fixed field validation rules using `_contains`, `_ncontains` or `_icontains` returning a 500 error instead of a 400 when the submitted value wasn't a string, and `_icontains` validation errors being reported as `contains`

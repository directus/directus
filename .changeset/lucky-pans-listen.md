---
'@directus/api': patch
---

Fixed storage connections leaking when asset requests were cancelled or a transformation failed, which eventually made every asset request return a permission error until Directus was restarted

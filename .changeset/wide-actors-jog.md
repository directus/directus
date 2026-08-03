---
'@directus/api': patch
---

Fixed collection creation not trimming whitespace before validating against the reserved `directus_` namespace, which allowed the reserved-prefix check to be bypassed with a leading or trailing space

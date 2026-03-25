---
"@directus/api": patch
---

Fixed invite acceptance error message leaking email address and account state. The error now returns a generic "invite is no longer valid" message for all failure cases.

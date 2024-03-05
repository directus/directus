---
'@directus/api': patch
---

Fixed an issue that would cause email sending to take a while for slower SMTP hosts by no longer awaiting the smtp
response

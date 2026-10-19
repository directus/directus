---
'@directus/api': patch
---

Fixed subscription delete events not enforcing read permissions. Delete events for a whole collection are now only sent to users who can read every item in it, and delete events for collections and fields are limited to admins.

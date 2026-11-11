---
'@directus/api': patch
'@directus/app': patch
'@directus/constants': minor
'@directus/utils': minor
---

Fixed icon fields (collection `meta.icon`, bookmarks, dashboards, panels, flows, roles and policies) accepting arbitrary text, which the app displayed in place of the icon; saving an unknown icon name now fails with a 400, and the app no longer renders unknown names it already has stored

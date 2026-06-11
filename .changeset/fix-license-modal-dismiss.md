---
'@directus/app': patch
---

Fixed license modals being impossible to dismiss when shown above a route drawer (e.g. field detail pages) by keeping dialog focus traps stacked in visual order, and scoped license dismissal cookies to the whole app so dismissals persist across navigation

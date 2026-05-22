---
'@directus/api': patch
'@directus/app': patch
'@directus/ai': patch
'@directus/utils': patch
---

Fixed AI assistant and visual editor updates so edits to versioned items, and edits to child rows reached through versioned parents, were saved to the correct version delta instead of published content.

Added shared write-target resolution for versioned saves and merged nested version deltas by relation identity so repeated saves updated existing relation entries instead of replacing sibling updates.

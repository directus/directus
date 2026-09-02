---
'@directus/app': patch
---

Fixed the WYSIWYG interface locking a field as read-only when its stored HTML only differs by collapsible whitespace,
such as the double spaces left behind by pasted content

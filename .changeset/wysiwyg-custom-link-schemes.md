---
'@directus/app': patch
---

Fixed the WYSIWYG interface silently dropping links with custom URL schemes such as `myapp://`, while still rejecting script-capable schemes like `javascript:`

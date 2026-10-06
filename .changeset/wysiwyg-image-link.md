---
'@directus/app': minor
---

Added support for linking images in the WYSIWYG editor: select an image and use the link toolbar button (or Mod+K) to wrap it in an anchor; stored `<a href><img></a>` markup now survives loading without triggering the normalization warning

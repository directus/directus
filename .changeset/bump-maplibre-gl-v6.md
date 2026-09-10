---
'@directus/app': patch
---

Updated MapLibre GL JS from 1.15.3 to 6.9.0

::: notice

The map layout and the geometry interface now require WebGL2, which MapLibre has mandated since v3. Browsers that only support WebGL1, chiefly Safari 14 and earlier and older Android devices, will no longer render maps.

Dragging with a pointer or a mouse wheel keeps the hovered item popup pinned to the cursor as before. Touch drags no longer reposition it, since the underlying touch event carries no cursor coordinates.

:::

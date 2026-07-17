---
'@directus/app': minor
---

Replaced TinyMCE with Tiptap as the engine of the `input-rich-text-html` (WYSIWYG) interface and removed the TinyMCE dependency. Existing fields keep working without migration: all interface option keys and stored toolbar values are unchanged.

⚠️ Potentially breaking changes:

- HTML output is normalized by the editor schema on the first edit and save: attribute order and entity encoding may change, list items are wrapped as `<li><p>`, legacy `<colgroup>` column widths become per-cell `colwidth` attributes, bare `<span>` tags without preserved attributes are unwrapped, and event-handler attributes (e.g. `onclick`) are dropped. Semantic tags (`section`, `article`, `figure`, `details`, `dl`, `mark`, `abbr`) and `class`/`id`/`data-*`/`aria-*` attributes are preserved.
- `<script>` and `<style>` tags are removed from content on the first edit and save.
- The `tinymceOverrides` option is deprecated and inert: stored values are kept and shown in the field settings, but no longer affect the editor, and a deprecation warning is logged in the console. Known uses have first-class equivalents: font sizes and families (`font_size_formats`/`font_family_formats`) are covered by the built-in `fontsize`/`fontfamily` toolbar menus, and custom styling by the `customFormats` option.
- The toolbar renders as a single row with a "show more" overflow menu instead of TinyMCE's multi-row layout, and the `preview` toolbar option was dropped (the editor is always live WYSIWYG).

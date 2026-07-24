---
'@directus/app': minor
---

Deprecated the `tinymceOverrides` option of the `input-rich-text-html` (WYSIWYG) interface and removed the remaining TinyMCE dependency.

- `tinymceOverrides` is now inert: stored values are kept and only shown in the field settings when a value is already set, but no longer affect the editor, and a deprecation warning is logged in the console. Known uses have first-class equivalents: font sizes and families (`font_size_formats`/`font_family_formats`) are covered by the built-in `fontsize`/`fontfamily` toolbar menus, and custom styling by the `customFormats` option.
- All other interface option keys and stored toolbar values are unchanged, so existing fields keep working without migration.

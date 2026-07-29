---
'@directus/app': major
---

Replaced the TinyMCE editor behind the WYSIWYG with Tiptap

To avoid data loss, the editor preserves attributes (`class`, `id`, `title`, `role`, `lang`, `dir`, `data-*`, `aria-*`) and non-schema semantic tags. If stored HTML still contains markup the editor would normalize, the field is locked read-only with a warning dialog, so no edit or autosave can rewrite it before you confirm; raw-value editing is disabled while locked so the warning can't be bypassed.

`tinymceOverrides` is deprecated and now inert: stored values are kept but no longer affect the editor, with a console warning. Use the built-in `fontsize`/`fontfamily` toolbar menus and the `customFormats` option instead. All other options and stored toolbar values are unchanged, so existing fields keep working without migration.

::: notice

**The WYSIWYG interface now runs on Tiptap instead of TinyMCE**

- `tinymceOverrides` no longer has any effect. Stored values are kept and a console warning is logged, but the editor ignores them. Use the `fontsize`/`fontfamily` toolbar menus and `customFormats` instead.
- TinyMCE is no longer bundled with the app, so anything depending on it (custom plugins, skins, content CSS, the global `tinymce` object) no longer applies.
- Existing content that contains markup the editor would normalize now locks the field read-only until the warning dialog is confirmed. Editing and autosave are blocked while locked, including raw-value editing.

:::

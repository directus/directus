---
'@directus/app': patch
---

Problem: The content edit forms weren't passing the user's text direction setting from the user store down to form
interfaces. Even though the system detected RTL languages correctly, the interfaces never received this information.

Solution:

1. Added the missing direction prop to content forms (item.vue and share-item.vue)

How it works now: When you select Arabic as your interface language, the user store detects it as RTL, passes this to
the forms, and all text interfaces including the Markdown editor automatically display right-to-left.

Files changed:

- Content form components to pass direction prop
- Markdown editor to use direction prop

The fix is purely language-based - no configuration needed. Select Arabic language and the Markdown editor automatically
becomes RTL.

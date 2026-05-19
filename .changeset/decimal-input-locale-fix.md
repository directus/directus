---
'@directus/app': patch
---

Fixed decimal and float input fields using locale-dependent number formatting by switching to text input with decimal input mode, preventing incorrect decimal separator display on systems with non-English locale settings

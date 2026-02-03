---
'@directus/app': patch
---

Summary ‣ Fix decimal inputs showing locale-specific separators when editing existing values. Editable decimal/float
inputs now consistently render values using `.` as the decimal separator, preventing locale-based formatting (e.g. `,`
in Belgium) from mutating user input.

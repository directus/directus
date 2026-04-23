---
'@directus/app': patch
---

Fixed decimal and float input fields rejecting the app locale's decimal separator (e.g. `,` in Dutch/German) on Chromium-based browsers. Float and decimal fields now use a text input with `inputmode="decimal"` so the separator is accepted uniformly across browsers, while integer fields continue to render as a native number input.

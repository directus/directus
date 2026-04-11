---
'@directus/app': patch
---

Excluded virtual fields like `$thumbnail` from export defaults and the Add field picker in the export sidebar so JSON exports no longer failed from synthetic field selection.

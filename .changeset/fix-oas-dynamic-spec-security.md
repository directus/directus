---
'@directus/api': patch
---

Fixed security declarations in the dynamically generated OAS spec. Custom collection paths now correctly carry `security: []` when the public role has access, and inherit the global `[{Auth:[]},{KeyAuth:[]}]` otherwise. Also resolved transitive schema reference gaps and a singleton collection response schema merging bug.

---
'@directus/api': patch
---

Fixed AI tools returning "An unknown error occurred." for payload validation errors. MCP and the assistant now get the
same message as the REST API, like `Validation failed for field "post". Value can't be null.`

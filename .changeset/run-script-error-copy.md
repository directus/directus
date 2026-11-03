---
'@directus/api': patch
---

Fixed Run Script operations and sandboxed extensions failing with "illegal access" when their data contained errors, such as the validation errors from a failed Condition operation. Errors are now passed into the sandbox as plain objects (with `name`, `message`, `code`, `status` and `extensions`) instead of `Error` instances

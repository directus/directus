---
"@directus/utils": patch
"@directus/api": patch
---

Added test coverage for validation rules using `count()` on array/m:n fields (fixes #26694).  The validation pipeline already injects `count(field)` from the payload and validates correctly; new unit tests in `inject-function-results.test.ts` and `validate-payload.test.ts` pin this behavior, and `process-payload.test.ts` now includes a test for field validation with `count(photos)` so that count-on-m:n validation is covered end-to-end and regressions are prevented.
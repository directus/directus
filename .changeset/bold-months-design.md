---
'@directus/pressure': patch
'@directus/types': patch
'@directus/env': major
'@directus/api': major
---

Improved typing of `@directus/env` to contain known env vars and added `milliseconds` and `bytes` cast types for human
readable durations (eg `15m`) and sizes (eg `10mb`). Custom env vars can be typed by extending the `Env` interface

::: notice

Env vars are now cast more strictly:

- Booleans only accept `true`, `false`, `1` and `0` (eg `TRUE` is now `false`)
- Plain number durations (eg `ACCESS_TOKEN_TTL=900`) are read as milliseconds, use a unit to be explicit (eg `15m`)
- Invalid values fall back to the default and log a warning, empty values only do so for non-string and non-list vars
- `useEnv` returns parsed values: durations and sizes are numbers, lists are arrays

:::

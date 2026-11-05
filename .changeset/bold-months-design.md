---
'@directus/pressure': patch
'@directus/types': major
'@directus/utils': minor
'@directus/env': major
'@directus/api': major
---

Improved typing of `@directus/env` to contain known env vars and added `milliseconds` and `bytes` cast types for human
readable durations (eg `15m`) and sizes (eg `10mb`). Custom env vars can be typed by extending the `Env` interface.
Added a `toMilliseconds` helper to `@directus/utils`

::: notice

Env vars are now cast more strictly:

- Booleans only accept `true`, `false`, `1` and `0` (eg `TRUE` is now `false`)
- Plain number durations (eg `ACCESS_TOKEN_TTL=900`) are read as milliseconds, use a unit to be explicit (eg `15m`)
- Invalid values fall back to the default and log a warning
- Variables without a value in a `.env` file (eg `KEY=`) are treated as not configured and fall back to the default. Use
  `KEY=""` for an empty value, eg `DB_PASSWORD=""` for a database user without a password, as `DB_PASSWORD=` is now
  reported as missing
- Empty values of string and list vars (eg `KEY=""` in a `.env` file or `KEY=` in the process environment) are kept as an
  empty string or list instead of falling back to the default, eg an empty `EMAIL_SENDMAIL_PATH` is no longer replaced by
  `/usr/sbin/sendmail`. Empty values of other vars still fall back to the default
- `useEnv` returns parsed values: durations and sizes are numbers, lists are arrays
- The `env` passed to API extensions is typed as `Env` instead of `Record<string, any>`, so custom env vars are `unknown`
  and need to be narrowed or typed by extending the `Env` interface

:::

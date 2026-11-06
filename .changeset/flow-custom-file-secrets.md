---
'@directus/env': minor
---

Added support for file-backed custom environment variables explicitly selected by `FLOWS_ENV_ALLOW_LIST`.

For example, `MY_SECRET_FILE=/run/secrets/my_secret` with `FLOWS_ENV_ALLOW_LIST=MY_SECRET` makes the file contents available as `$env.MY_SECRET` in Flows. Custom file-backed values take precedence over direct values for the same variable. Unselected custom `_FILE` variables retain their existing behavior.

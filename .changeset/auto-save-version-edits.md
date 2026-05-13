---
'@directus/api': minor
'@directus/app': minor
'@directus/env': minor
'@directus/system-data': patch
'@directus/types': patch
---

Added auto-save for version edits. While editing a version, changes are debounced and written in place; new revisions are created at session start and after a configurable interval. The manual save button is removed on versions; failed auto-saves surface a persistent error toast and disable the Publish button until the next save succeeds.

The revision interval can be configured globally via the new `CONTENT_VERSIONING_AUTOSAVE_REVISION_INTERVAL` env var (default: 5 minutes) and overridden per collection from the data-model settings.

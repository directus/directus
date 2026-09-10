---
'@directus/app': minor
'@directus/api': minor
'@directus/sdk': minor
'@directus/cli': patch
'@directus/specs': patch
'@directus/system-data': patch
'@directus/types': patch
---

Moved Flows into their own module and added a suite of enhancements covering folder organization, search and filtering, import and export, duplication, and new trigger and operation options

- Moved Flows to their own entry in the module bar at `/flows` instead of under Settings, redirected existing `/settings/flows` links, and enabled the module automatically for existing projects
- Organize Flows into folders, browsed from the main sidebar like the File Library (the selected folder is kept in the URL), with creating, renaming, moving, and deleting folders, and moving one or more Flows into a folder or back to the root
- Search and filter the Flows page
- Import and export Flows as JSON from the Data Studio
- Duplicate an existing Flow
- Search within the Collections field of a Flow trigger
- Set a manual trigger's location to `None (Hidden)`, so the Flow renders no button of its own and runs only from a Manual Flow field
- Set an optional From Name on the Send Email operation, defaulting to the project name

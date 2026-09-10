---
'@directus/app': minor
'@directus/api': minor
'@directus/sdk': minor
'@directus/cli': patch
'@directus/specs': patch
'@directus/system-data': patch
'@directus/types': patch
---

Added a suite of Flows enhancements covering folder organization, search and filtering, import and export, duplication, and new trigger and operation options

- Organize Flows into folders, browsed from a resizable, collapsible sidebar on the Flows page (the selected folder is kept in the URL), with creating, renaming, moving, and deleting folders, and moving one or more Flows into a folder or back to the root
- Search and filter the Flows page
- Import and export Flows as JSON from the Data Studio
- Duplicate an existing Flow
- Search within the Collections field of a Flow trigger
- Set a manual trigger's location to `None (Hidden)`, so the Flow renders no button of its own and runs only from a Manual Flow field
- Set an optional From Name on the Send Email operation, defaulting to the project name

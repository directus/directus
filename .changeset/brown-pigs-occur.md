---
'@directus/system-data': major
'@directus/specs': major
'@directus/types': major
'@directus/api': major
'@directus/app': major
'@directus/sdk': major
---

Removed the deprecated `/webhooks` functionality across the stack. This includes the API route and its related tests,
controller, and mocks, as well as the corresponding SDK commands and schema types, types and services, system fields and
collections, OpenAPI specifications, and App UI routes and components. This endpoint has been unused for over a year and
has now been fully removed.

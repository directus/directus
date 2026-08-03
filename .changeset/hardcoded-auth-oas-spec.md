---
'@directus/constants': minor
'@directus/specs': patch
'@directus/api': patch
'@directus/app': patch
---

Fixed the dynamically generated OAS spec (`GET /server/specs/oas`) incorrectly documenting operations with a hardcoded, RBAC-independent auth requirement (e.g. admin-only Collections/Fields/Relations/Extensions mutations, authenticated-user-only Comments mutations) as available or public based on RBAC permissions alone. Added a warning in the policy permission editor when a configured permission is always overridden by a hardcoded admin check.

---
'@directus/sdk': patch
---

Fixed SDK types for `directus_policies.users`, `directus_policies.roles` and `directus_users.policies` to reflect the policies permission system. These relations are M2M through `directus_access` but were typed as direct arrays of `DirectusUser`/`DirectusRole`/`DirectusPolicy`, which did not match the API payload.

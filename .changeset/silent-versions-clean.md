---
"@directus/app": patch
---

Fixed a silent 403 when publishing an itemless content version (a new item created directly as a draft) under a role that lacks Delete permission on `directus_versions`.

`publishItemlessAndNavigate` promoted the version successfully but then called `deleteVersion` unconditionally, without checking `deleteVersionsAllowed` first. For roles without that permission, the delete request was rejected and the resulting unhandled rejection surfaced to the user as a generic "Forbidden" error — even though the publish itself had already succeeded and the item was live. This mirrors the delete-permission check already used in `onVersionPublishConfirm` and `onVersionPublishWithoutReview`, so cleanup of the promoted version row is now opportunistic (attempted only when the role is allowed to do it) consistently across all three publish code paths.

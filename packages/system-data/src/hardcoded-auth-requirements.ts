/**
 * Collection + action pairs gated by an explicit accountability check, outside of RBAC.
 *
 * - `admin`: requires `accountability.admin` (internal calls with no `accountability` pass).
 * - `user`: requires an authenticated request (`accountability.user`).
 *
 * Checked in the service layer, except `directus_extensions`, which is gated in its route handlers:
 * `create` maps to `POST /extensions/registry/install`, `update`/`delete` to `PATCH`/`DELETE
 * /extensions/:pk`.
 */
export const HARDCODED_AUTH_REQUIREMENTS = [
	{ collection: 'directus_collections', action: 'create', requiredAuth: 'admin' },
	{ collection: 'directus_collections', action: 'delete', requiredAuth: 'admin' },
	{ collection: 'directus_collections', action: 'update', requiredAuth: 'admin' },
	{ collection: 'directus_comments', action: 'create', requiredAuth: 'user' },
	{ collection: 'directus_comments', action: 'delete', requiredAuth: 'user' },
	{ collection: 'directus_comments', action: 'update', requiredAuth: 'user' },
	{ collection: 'directus_extensions', action: 'create', requiredAuth: 'admin' },
	{ collection: 'directus_extensions', action: 'delete', requiredAuth: 'admin' },
	{ collection: 'directus_extensions', action: 'update', requiredAuth: 'admin' },
	{ collection: 'directus_fields', action: 'create', requiredAuth: 'admin' },
	{ collection: 'directus_fields', action: 'delete', requiredAuth: 'admin' },
	{ collection: 'directus_fields', action: 'update', requiredAuth: 'admin' },
	{ collection: 'directus_relations', action: 'create', requiredAuth: 'admin' },
	{ collection: 'directus_relations', action: 'delete', requiredAuth: 'admin' },
	{ collection: 'directus_relations', action: 'update', requiredAuth: 'admin' },
] as const;

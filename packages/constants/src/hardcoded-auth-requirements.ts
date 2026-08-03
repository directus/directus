import type { PERMISSION_ACTIONS } from './permissions.js';

/** Collection+action pairs whose auth requirement is enforced in the service layer, independent of RBAC.
 * A permission granted for one of these is silently ineffective. */
export const HARDCODED_AUTH_REQUIREMENTS: ReadonlyArray<{
	collection: string;
	action: (typeof PERMISSION_ACTIONS)[number];
	requiredAuth: 'admin' | 'user';
}> = [
	{ collection: 'directus_collections', action: 'create', requiredAuth: 'admin' },
	{ collection: 'directus_collections', action: 'update', requiredAuth: 'admin' },
	{ collection: 'directus_collections', action: 'delete', requiredAuth: 'admin' },
	{ collection: 'directus_fields', action: 'create', requiredAuth: 'admin' },
	{ collection: 'directus_fields', action: 'update', requiredAuth: 'admin' },
	{ collection: 'directus_fields', action: 'delete', requiredAuth: 'admin' },
	{ collection: 'directus_relations', action: 'create', requiredAuth: 'admin' },
	{ collection: 'directus_relations', action: 'update', requiredAuth: 'admin' },
	{ collection: 'directus_relations', action: 'delete', requiredAuth: 'admin' },
	{ collection: 'directus_extensions', action: 'update', requiredAuth: 'admin' },
	{ collection: 'directus_comments', action: 'create', requiredAuth: 'user' },
	{ collection: 'directus_comments', action: 'update', requiredAuth: 'user' },
	{ collection: 'directus_comments', action: 'delete', requiredAuth: 'user' },
];

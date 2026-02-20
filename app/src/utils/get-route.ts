import { isSystemCollection } from '@directus/system-data';

const accessibleSystemCollections = {
	directus_users: { route: '/users' },
	directus_files: { route: '/files' },
	directus_dashboards: { route: '/insights' },
	directus_activity: { route: '/activity' },
	directus_settings: { route: '/settings/project', singleton: true },
	directus_collections: { route: '/settings/data-model' },
	directus_roles: { route: '/settings/roles' },
	directus_presets: { route: '/settings/presets' },
	directus_translations: { route: '/settings/translations' },
	directus_flows: { route: '/settings/flows' },
} as const;

function isAccessibleSystemCollection(collection: string): collection is keyof typeof accessibleSystemCollections {
	return collection in accessibleSystemCollections;
}

/**
 * Get the route of an accessible system collection in the admin app for a given collection name
 *
 * @param collection - Collection name
 * @returns - URL route for the system collection, empty string if not an accessible system collection
 */
export function getSystemCollectionRoute(collection: string) {
	if (isAccessibleSystemCollection(collection)) return accessibleSystemCollections[collection].route;

	return '';
}

/**
 * Get the route of a collection in the admin app for a given collection name
 *
 * @param collection - Collection name
 * @returns - URL route for the collection
 */
export function getCollectionRoute(collection: string | null) {
	if (collection === null) return '';

	if (isSystemCollection(collection)) return getSystemCollectionRoute(collection);

	return `/content/${collection}`;
}

/**
 * Get the route of an item in the admin app for a given collection name and primary key
 *
 * @param collection - Collection name
 * @param primaryKey - Primary key of item
 * @param versionKey - Optional version key to append as query parameter
 * @returns - URL route for the item
 */
export function getItemRoute(
	collection: string | null,
	primaryKey: string | number,
	versionKey?: string | null | undefined,
) {
	if (collection === null) return '';

	const collectionRoute = getCollectionRoute(collection);

	if (collectionRoute === '') return '';

	if (isAccessibleSystemCollection(collection) && 'singleton' in accessibleSystemCollections[collection])
		return collectionRoute;

	const itemRoute = primaryKey === '+' ? primaryKey : encodeURIComponent(primaryKey);

	const base = `${collectionRoute}/${itemRoute}`;

	return versionKey ? `${base}?version=${versionKey}` : base;
}

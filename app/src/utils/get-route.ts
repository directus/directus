/**
 * Get the route of a collection in the admin app for a given collection name
 *
 * @param collection - Collection name
 * @returns - URL route for the collection
 */
export function getCollectionRoute(collection: string | null) {
	if (collection === null) return '';

	const route = collection.startsWith('directus_') ? collection.substring(9) : `content/${collection}`;

	return `/${route}`;
}

/**
 * Get the route of an item in the admin app for a given collection name and primary key
 *
 * @param collection - Collection name
 * @param primaryKey - Primary key of item
 * @returns - URL route for the item
 */
export function getItemRoute(collection: string | null, primaryKey: string | number) {
	if (collection === null) return '';

	const collectionRoute = getCollectionRoute(collection);

	return `${collectionRoute}/${encodeURIComponent(primaryKey)}`;
}

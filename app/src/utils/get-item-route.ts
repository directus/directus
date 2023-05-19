/**
 * Get the route of an item in the admin app for a given collection and primary key
 *
 * @param collection - Collection name
 * @param primaryKey - Primary key of item
 * @returns - URL route for the item
 */
export function getItemRoute(collection: string | null, primaryKey: string | number) {
	if (collection === null) return '';

	const route = collection.startsWith('directus_') ? collection.substring(9) : `content/${collection}`;

	return `/${route}/${primaryKey}`;
}

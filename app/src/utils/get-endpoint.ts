export function getEndpoint(collection: string) {
	if (collection.startsWith('directus_')) {
		return `/${collection.substring(9)}`;
	}

	return `/items/${collection}`;
}

export function isExcludedCollection(collection: { meta: { excluded?: boolean } | null }): boolean {
	return collection.meta?.excluded === true;
}

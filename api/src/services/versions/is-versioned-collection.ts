export function isVersionedCollection(collection: string): boolean {
	// TODO: Rename to `directus_versions_` once shadow tables are supported
	return collection.startsWith('shadow_');
}

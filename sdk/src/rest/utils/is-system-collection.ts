
export function isSystemCollection(collection: string): boolean {
	// @ts-expect-error values injected at build time
	const collections: string[] = __SYSTEM_COLLECTION_NAMES__;
	return collections.includes(collection);
}

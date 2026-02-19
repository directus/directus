export function toVersionedCollectionName(name: string): string {
	// TODO: Rename to `directus_versions_${name}` once shadow tables are supported
	return `shadow_${name}`;
}

export function toVersionedRelationName(name: string): string {
	// TODO: Rename to `directus_${name}` once shadow tables are supported
	return `shadow_${name}`;
}

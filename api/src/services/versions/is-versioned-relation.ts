export function isVersionedRelation(relation: string): boolean {
	// TODO: Rename to `directus_` once shadow tables are supported
	return relation.startsWith('shadow_');
}

export function isShadow(name: string | undefined, type: 'field' | 'collection') {
	if (!name) return false;
	return type === 'field' ? name.startsWith('directus_') : name.startsWith('directus_versions_');
}

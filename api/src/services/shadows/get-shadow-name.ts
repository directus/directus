export function getShadowName(value: string, type: 'field' | 'collection') {
	if (type === 'field') {
		return `directus_${value}`;
	}

	return `directus_versions_${value}`;
}

import { Type } from '@directus/types';

export function getSpecialForType(type: Type): string[] | null {
	// Geometry types encode their subtype in `type` (e.g. `geometry.Point`)
	// Preserve it in `special` to avoid collapsing back to the generic `geometry` type after schema updates
	if (type.startsWith('geometry')) return [type];

	switch (type) {
		case 'json':
		case 'csv':
		case 'boolean':
			return ['cast-' + type];
		case 'uuid':
		case 'hash':
			return [type];
		default:
			return null;
	}
}

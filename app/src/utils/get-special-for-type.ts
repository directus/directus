import { Type } from '@directus/types';

export function getSpecialForType(type: Type): string[] | null {
	switch (type) {
		case 'json':
		case 'csv':
		case 'boolean':
			return ['cast-' + type];
		case 'uuid':
		case 'hash':
			return [type];
		default:
			// geometry types carry their subtype in the type (e.g. `geometry.Point`); keep it in
			// `special` so the column doesn't collapse to a generic `geometry` on the next schema change
			if (type.startsWith('geometry')) return [type];
			return null;
	}
}

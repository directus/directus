import { Type } from '@directus/shared/types';

export function getSpecialForType(type: Type): string[] | null {
	switch (type) {
		case 'json':
		case 'csv':
		case 'boolean':
			return ['cast-' + type];
		case 'uuid':
		case 'hash':
		case 'geometry':
			return [type];
		default:
			return null;
	}
}

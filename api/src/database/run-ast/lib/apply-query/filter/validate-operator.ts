import { InvalidQueryError } from '@directus/errors';
import type { ClientFilterOperator, Type } from '@directus/types';
import { getFilterOperatorsForType } from '@directus/utils';

function normalizeGeospatialType(type: Type): Type {
	const runtimeType = String(type);

	if (
		runtimeType === 'geometry' ||
		runtimeType.startsWith('geometry.') ||
		runtimeType === 'geography' ||
		runtimeType.startsWith('geography.')
	) {
		return 'geometry';
	}

	return type;
}

export function validateOperator(type: Type, filterOperator: string, special?: string[]) {
	if (filterOperator.startsWith('_')) {
		filterOperator = filterOperator.slice(1);
	}

	const normalizedType = normalizeGeospatialType(type);

	if (!getFilterOperatorsForType(normalizedType).includes(filterOperator as ClientFilterOperator)) {
		throw new InvalidQueryError({
			reason: `"${type}" field type does not contain the "_${filterOperator}" filter operator`,
		});
	}

	if (
		special?.includes('conceal') &&
		!getFilterOperatorsForType('hash').includes(filterOperator as ClientFilterOperator)
	) {
		throw new InvalidQueryError({
			reason: `Field with "conceal" special does not allow the "_${filterOperator}" filter operator`,
		});
	}
}

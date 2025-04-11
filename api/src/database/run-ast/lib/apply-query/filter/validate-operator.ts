import { InvalidQueryError } from '@directus/errors';
import type { ClientFilterOperator, Type } from '@directus/types';
import { getFilterOperatorsForType } from '@directus/utils';

export function validateOperator(type: Type, filterOperator: string, special?: string[]) {
	if (filterOperator.startsWith('_')) {
		filterOperator = filterOperator.slice(1);
	}

	if (!getFilterOperatorsForType(type).includes(filterOperator as ClientFilterOperator)) {
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

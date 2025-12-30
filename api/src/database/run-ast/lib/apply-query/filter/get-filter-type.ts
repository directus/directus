import { parseFilterKey } from '../../../../../utils/parse-filter-key.js';
import { InvalidQueryError } from '@directus/errors';
import type { FieldFunction, FieldOverview } from '@directus/types';
import { getFunctionsForType, getOutputTypeForFunction } from '@directus/utils';

export function getFilterType(fields: Record<string, FieldOverview>, key: string, collection = 'unknown') {
	const { fieldName, functionName } = parseFilterKey(key);

	const field = fields[fieldName];

	if (!field) {
		throw new InvalidQueryError({ reason: `Invalid filter key "${key}" on "${collection}"` });
	}

	const { type } = field;

	if (functionName) {
		const availableFunctions: string[] = getFunctionsForType(type);

		if (!availableFunctions.includes(functionName)) {
			throw new InvalidQueryError({ reason: `Invalid filter key "${key}" on "${collection}"` });
		}

		const functionType = getOutputTypeForFunction(functionName as FieldFunction);

		return { type: functionType };
	}

	return { type, special: field.special };
}

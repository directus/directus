import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import { FieldFunction } from '@directus/types';

/**
 * Extracts the function and field name of a field wrapped in a function
 *
 * @param fieldKey - Field in function, for example `year(date_created)`
 * @return Object of function name and field key
 *
 * @example
 * ```js
 * extractFieldFromFunction('year(date_created)');
 * // => { fn: 'year', field: 'date_created' }
 * ```
 */
export function extractFieldFromFunction(fieldKey: string): { fn: FieldFunction | null; field: string } {
	let functionName;

	if (fieldKey.includes('(') && fieldKey.includes(')')) {
		functionName = fieldKey.split('(')[0] as FieldFunction | undefined;
		fieldKey = fieldKey.match(REGEX_BETWEEN_PARENS)![1];
	}

	return { fn: functionName ?? null, field: fieldKey };
}

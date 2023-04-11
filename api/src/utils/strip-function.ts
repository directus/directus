import { REGEX_BETWEEN_PARENS } from '@directus/constants';

/**
 * Strip the function declarations from a list of fields
 */
export function stripFunction(field: string): string {
	if (field.includes('(') && field.includes(')')) {
		return field.match(REGEX_BETWEEN_PARENS)?.[1]?.trim() ?? field;
	} else {
		return field;
	}
}

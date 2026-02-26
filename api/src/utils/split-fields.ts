import { InvalidQueryError } from '@directus/errors';

/**
 * Parenthesis aware splitting of fields allowing for `json(a, b)` field functions
 */
export function splitFields(input: string): string[] {
	const fields: string[] = [];
	let current = '';
	let depth = 0;

	for (const char of input) {
		if (char === '(') {
			depth++;

			if (depth > 1) {
				throw new InvalidQueryError({ reason: 'Nested functions are not supported in "fields"' });
			}
		} else if (char === ')') {
			depth--;
		}

		if (char === ',' && depth === 0) {
			fields.push(current);
			current = '';
		} else {
			current += char; 
		}
	}

	if (depth !== 0) {
		throw new InvalidQueryError({ reason: 'Missing closing parenthesis in "fields"' });
	}

	fields.push(current);
	return fields;
}

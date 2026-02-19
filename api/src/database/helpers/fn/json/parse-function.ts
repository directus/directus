import { useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';

const env = useEnv();
const MAX_JSON_QUERY_DEPTH = Number(env['MAX_JSON_QUERY_DEPTH']);

/**
 * Calculates the depth of a JSON path by counting the number of property accesses and array accesses.
 * @example .color → 1
 * @example .settings.theme → 2
 * @example .items[0].name → 3
 * @example [0] → 1
 */
export function calculateJsonPathDepth(path: string): number {
	let depth = 0;

	for (let i = 0; i < path.length; i++) {
		if (path[i] === '.' || path[i] === '[') {
			depth++;
		}
	}

	return depth;
}

/**
 * Parses a json function selection into its field and path components.
 * Expects relational prefixes to have already been extracted by parseFilterFunctionPath,
 * so the field should always be a simple column name.
 * @example json(metadata, color) → { field: 'metadata', path: '.color' }
 * @example json(data, items[0].name) → { field: 'data', path: '.items[0].name' }
 */
export function parseJsonFunction(functionString: string): { field: string; path: string } {
	if (!functionString.startsWith('json(') || !functionString.endsWith(')')) {
		throw new InvalidQueryError({ reason: 'Invalid json() syntax' });
	}

	// Extract content between parentheses
	const content = functionString.substring('json('.length, functionString.length - 1).trim();

	if (!content) {
		throw new InvalidQueryError({ reason: 'Invalid json() syntax' });
	}

	// Split on comma to separate field from path
	const commaIndex = content.indexOf(',');

	if (commaIndex === -1) {
		throw new InvalidQueryError({ reason: 'Invalid json() syntax: requires json(field, path) format' });
	}

	if (commaIndex === 0) {
		throw new InvalidQueryError({ reason: 'Invalid json() syntax: missing field name' });
	}

	const field = content.substring(0, commaIndex).trim();
	const pathContent = content.substring(commaIndex + 1).trim();

	if (!pathContent) {
		throw new InvalidQueryError({ reason: 'Invalid json() syntax: missing path' });
	}

	// Normalize path to always start with dot or bracket
	const path = pathContent.startsWith('[') ? pathContent : '.' + pathContent;

	// Validate JSON path depth
	const depth = calculateJsonPathDepth(path);

	if (depth > MAX_JSON_QUERY_DEPTH) {
		throw new InvalidQueryError({
			reason: `JSON path depth exceeds maximum allowed depth of ${MAX_JSON_QUERY_DEPTH} (got ${depth})`,
		});
	}

	return {
		field,
		path,
	};
}

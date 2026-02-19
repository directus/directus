import { useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';

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
 * Parses a json function selection into its field and path components
 * Uses comma as delimiter between field and JSON path, avoiding collision with A2O colon syntax.
 * @example json(metadata, color) → { field: 'metadata', path: '.color' }
 * @example json(data, items[0].name) → { field: 'data', path: '.items[0].name' }
 * @example json(author.profile, settings.theme) → { field: 'author.profile', path: '.settings.theme' }
 * @example json(relation.item:collection.field, path) → { field: 'relation.item:collection.field', path: '.path' }
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

	// Validate JSON path depth (only counts the JSON path portion, not relational field segments)
	const env = useEnv();
	const maxDepth = Number(env['MAX_JSON_QUERY_DEPTH']);
	const depth = calculateJsonPathDepth(path);

	if (depth > maxDepth) {
		throw new InvalidQueryError({
			reason: `JSON path depth exceeds maximum allowed depth of ${maxDepth} (got ${depth})`,
		});
	}

	return {
		field,
		path,
	};
}

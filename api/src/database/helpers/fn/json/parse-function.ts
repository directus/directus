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
		throw new Error('Invalid json() syntax');
	}

	// Extract content between parentheses
	const content = functionString.substring('json('.length, functionString.length - 1).trim();

	if (!content) {
		throw new Error('Invalid json() syntax');
	}

	// Split on comma to separate field from path
	const commaIndex = content.indexOf(',');

	if (commaIndex === -1) {
		throw new Error('Invalid json() syntax: requires json(field, path) format');
	}

	if (commaIndex === 0) {
		throw new Error('Invalid json() syntax: missing field name');
	}

	const field = content.substring(0, commaIndex).trim();
	const pathContent = content.substring(commaIndex + 1).trim();

	if (!pathContent) {
		throw new Error('Invalid json() syntax: missing path');
	}

	// Normalize path to always start with dot or bracket
	const path = pathContent.startsWith('[') ? pathContent : '.' + pathContent;

	return {
		field,
		path,
	};
}

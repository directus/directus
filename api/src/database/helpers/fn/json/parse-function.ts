/**
 * Parses json(field:path.to.value) into components
 * Uses colon as delimiter between field and JSON path to avoid ambiguity with relational fields.
 * @example json(metadata:color) → { field: 'metadata', path: '.color' }
 * @example json(data:items[0].name) → { field: 'data', path: '.items[0].name' }
 * @example json(author.profile:settings.theme) → { field: 'author.profile', path: '.settings.theme' }
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

	// Split on colon to separate field from path
	const colonIndex = content.indexOf(':');

	if (colonIndex === -1) {
		throw new Error('Invalid json() syntax: requires field:path format');
	}

	if (colonIndex === 0) {
		throw new Error('Invalid json() syntax: missing field name');
	}

	const field = content.substring(0, colonIndex);
	const pathContent = content.substring(colonIndex + 1);

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

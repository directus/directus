/**
 * Parses json(field.path.to.value) into components
 * @example json(metadata.color) → { field: 'metadata', path: '.color' }
 * @example json(data.items[0].name) → { field: 'data', path: '.items[0].name' }
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

	// Split on first dot to separate field from path
	const firstDotIndex = content.indexOf('.');

	if (firstDotIndex === -1 || firstDotIndex === 0) {
		throw new Error('Invalid json() syntax');
	}

	return {
		field: content.substring(0, firstDotIndex),
		path: content.substring(firstDotIndex), // Keeps the leading dot
	};
}

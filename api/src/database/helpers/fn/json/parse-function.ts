/**
 * Parses json(field.path.to.value) into components
 * @example json(metadata.color) → { field: 'metadata', path: '.color' }
 * @example json(data.items[0].name) → { field: 'data', path: '.items[0].name' }
 * @example json(data[0].name) → { field: 'data', path: '[0].name' }
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

	// Split on first dot or bracket to separate field from path
	const firstDotIndex = content.indexOf('.');
	const firstBracketIndex = content.indexOf('[');

	// Determine which delimiter comes first (or if only one exists)
	let splitIndex: number;

	if (firstDotIndex === -1 && firstBracketIndex === -1) {
		throw new Error('Invalid json() syntax');
	} else if (firstDotIndex === -1) {
		splitIndex = firstBracketIndex;
	} else if (firstBracketIndex === -1) {
		splitIndex = firstDotIndex;
	} else {
		splitIndex = Math.min(firstDotIndex, firstBracketIndex);
	}

	if (splitIndex === 0) {
		throw new Error('Invalid json() syntax');
	}

	return {
		field: content.substring(0, splitIndex),
		path: content.substring(splitIndex), // Keeps the leading dot or bracket
	};
}

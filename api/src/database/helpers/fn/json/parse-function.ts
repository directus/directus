/**
 * Parses json(field:path.to.value) into components
 * Uses colon as delimiter between field and JSON path to avoid ambiguity with relational fields.
 * @example json(metadata:color) → { field: 'metadata', path: '.color', hasWildcard: false }
 * @example json(data:items[0].name) → { field: 'data', path: '.items[0].name', hasWildcard: false }
 * @example json(data:items[].name) → { field: 'data', path: '.items[].name', hasWildcard: true }
 * @example json(author.profile:settings.theme) → { field: 'author.profile', path: '.settings.theme', hasWildcard: false }
 */
export function parseJsonFunction(functionString: string): { field: string; path: string; hasWildcard: boolean } {
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

	// Check for array wildcard syntax: [] (empty brackets)
	const hasWildcard = path.includes('[]');

	return {
		field,
		path,
		hasWildcard,
	};
}

/**
 * Parse a wildcard path into array path and value path for databases
 * that require iterating over arrays (SQLite, MSSQL)
 * @example ".items[].name" → { arrayPath: "$.items", valuePath: "$.name" }
 * @example ".items[]" → { arrayPath: "$.items", valuePath: "$" }
 * @example "[].name" → { arrayPath: "$", valuePath: "$.name" }
 */
export function parseWildcardPath(path: string): { arrayPath: string; valuePath: string } {
	// Find the first [] wildcard
	const wildcardIndex = path.indexOf('[]');

	if (wildcardIndex === -1) {
		throw new Error('Path does not contain wildcard');
	}

	// Path before the wildcard (the array to iterate)
	const beforeWildcard = path.substring(0, wildcardIndex);
	// Path after the wildcard (what to extract from each element)
	const afterWildcard = path.substring(wildcardIndex + 2);

	// Convert to JSON path format
	const arrayPath = beforeWildcard ? '$' + beforeWildcard : '$';
	const valuePath = afterWildcard ? '$' + afterWildcard : '$';

	return { arrayPath, valuePath };
}

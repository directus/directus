/**
 * Unescape single quotes that had been escaped to double single quotes
 */
export function unescapeSingleQuotes(value?: string | null): string | null {
	if (value === null || value === undefined) {
		return null;
	}

	return value.replace(/''/g, "'");
}

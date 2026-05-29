/**
 * Extracts the function name from a function call string, e.g. `year(date_created)` → `'year'`.
 * Returns null if the string is not a recognized function call.
 */
export function extractFunctionName(str: string): string | null {
	const trimmed = str.trim();

	if (!trimmed.includes('(') || !trimmed.endsWith(')')) {
		return null;
	}

	return trimmed.split('(')[0] ?? null;
}

/**
 * Parse an OAuth scope string into a deduplicated array of scope tokens.
 * Per RFC 6749 Section 3.3, scope is a space-separated list of case-sensitive strings.
 */
export function parseOAuthScope(scope: unknown): string[] {
	if (typeof scope !== 'string' || scope.trim() === '') return [];
	return [...new Set(scope.trim().split(/\s+/))];
}

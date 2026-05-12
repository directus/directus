/**
 * Remove named query parameters from a path string.
 * All other query params are preserved. No trailing '?' is added when the result is empty.
 *
 * @param path - URL path string (may contain query params)
 * @param keys - Query param keys to remove
 */
export function removeQueryFromPath(path: string, ...keys: string[]): string {
	const [base, search] = path.split('?');
	const queryParams = new URLSearchParams(search || '');

	for (const key of keys) {
		queryParams.delete(key);
	}

	const remaining = queryParams.toString();

	return remaining ? `${base}?${remaining}` : base!;
}

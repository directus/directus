/**
 * Add a object of strings to a given path as query parameters. It will keep whatever query
 * parameters already existed on the path
 *
 * @param path - URL path to add query parameters too
 * @param query - Object style query parameters to add
 */
export function addQueryToPath(path: string, query: Record<string, string>): string {
	const queryParams = new URLSearchParams(path.split('?')[1] || '');

	for (const [key, value] of Object.entries(query)) {
		queryParams.set(key, value);
	}

	return path.split('?')[0] + '?' + queryParams;
}

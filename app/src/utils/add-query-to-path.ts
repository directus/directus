/**
 * Add a object of strings to a given path as query parameters.
 * It will keep whatever query parameters already existed on the path.
 *
 * @param path - URL path to add query parameters to
 * @param query - Object style query parameters to add
 */
export function addQueryToPath(path: string, query: Record<string, string>): string {
	const [base, existingQuery] = path.split('?') as [string, string | undefined];

	const queryParams = new URLSearchParams(existingQuery);

	for (const [key, value] of Object.entries(query)) {
		queryParams.set(key, value);
	}

	return queryParams.size > 0 ? `${base}?${queryParams}` : base;
}

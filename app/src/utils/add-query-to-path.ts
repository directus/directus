export function addQueryToPath(path: string, query: Record<string, string>): string {
	const queryParams = new URLSearchParams(path.split('?')[1] || '');

	for (const [key, value] of Object.entries(query)) {
		queryParams.set(key, value);
	}

	return path.split('?')[0] + '?' + queryParams;
}

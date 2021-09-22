export function addQueryToPath(path: string, query: Record<string, string>): string {
	const queryParams = [];

	for (const [key, value] of Object.entries(query)) {
		queryParams.push(`${key}=${value}`);
	}

	return path.includes('?') ? `${path}&${queryParams.join('&')}` : `${path}?${queryParams.join('&')}`;
}

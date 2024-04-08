export function extractData<T = unknown>(data: { data: T } | T): T {
	if (data && typeof data === 'object' && 'data' in data) {
		return data.data;
	}

	return data;
}

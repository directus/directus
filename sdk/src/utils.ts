export function serializeParams(params: Record<string, any>) {
	// TODO serialize params better
	const result = Object.fromEntries(
		Object.entries(params).map((item) => {
			if (typeof item[1] === 'object' && !Array.isArray(item[1])) {
				return [item[0], JSON.stringify(item[1])];
			}

			return item;
		})
	);

	return new URLSearchParams(result).toString();
}

export function withoutTrailingSlash(url: string) {
	return url.endsWith('/') ? url.slice(0, -1) : url;
}

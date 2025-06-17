export function sieveFunctions(data: unknown): unknown {
	if (typeof data === 'function') {
		return undefined;
	} else if (Array.isArray(data)) {
		return data.map(sieveFunctions);
	} else if (typeof data === 'object' && data !== null) {
		return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, sieveFunctions(value)]));
	}

	return data;
}

export function sieveFunctions(data: unknown): unknown {
	if (typeof data === 'function') {
		return undefined;
	} else if (Array.isArray(data)) {
		return data.map(sieveFunctions);
	} else if (data instanceof Error) {
		// Errors can't reliably be copied into an isolate (e.g. the lazy stack accessor in Node 26),
		// so convert them to plain objects, keeping the non-enumerable name, message and cause
		const error: Record<string, unknown> = {
			name: data.name,
			message: data.message,
			...(sieveFunctions({ ...data }) as Record<string, unknown>),
		};

		if (data.cause !== undefined) error['cause'] = sieveFunctions(data.cause);

		return error;
	} else if (typeof data === 'object' && data !== null) {
		return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, sieveFunctions(value)]));
	}

	return data;
}

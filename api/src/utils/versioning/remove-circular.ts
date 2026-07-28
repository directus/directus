export function removeCircular(obj: unknown, seen = new WeakSet()) {
	if (assertIsRecord(obj)) {
		if (seen.has(obj)) return null; // Or use 'delete' on the parent key
		seen.add(obj);

		for (const key in obj) {
			if (typeof obj[key] === 'object') {
				const result = removeCircular(obj[key], seen);
				if (result === null) delete obj[key];
			}
		}
	}

	return obj;
}

function assertIsRecord(val: unknown): val is Record<string, any> {
	return typeof val === 'object' && val !== null;
}

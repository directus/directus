export function toArray<T = any>(val: T | T[]): T[] {
	if (typeof val === 'string') {
		if (val === '') return [];
		return val.split(',') as unknown as T[];
	}

	return Array.isArray(val) ? val : [val];
}

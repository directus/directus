export function toArray<T = any>(val: T | T[]): T[] {
	return Array.isArray(val) ? val : [val];
}

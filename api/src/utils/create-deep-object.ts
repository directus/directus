/**
 * Create a nested object from a dot-notation key path with a value at the deepest level.
 * Example: ("related.title", { "_icontains": "abc" }) => { related: { title: { _icontains: "abc" } } }
 */
export function createDeepObject(key: string, value: any): Record<string, any> {
	const keys = key.split('.');
	return keys.reverse().reduce((acc, k) => ({ [k]: acc }), value);
}

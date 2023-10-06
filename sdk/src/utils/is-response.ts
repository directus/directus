/**
 * Custom type guard to check if an object is likely a Fetch Response
 */
export function isFetchResponse(result: unknown): result is Response {
	if (typeof result !== 'object' || !result) return false;

	return (
		'headers' in result &&
		'ok' in result &&
		'json' in result &&
		typeof result.json === 'function' &&
		'text' in result &&
		typeof result.json === 'function'
	);
}

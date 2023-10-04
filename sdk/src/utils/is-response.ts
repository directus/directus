/**
 *
 * @param {boolean} result
 */
export function isFetchResponse(result: unknown): boolean {
	if (typeof result !== 'object' || !result) return false;

	return (
		'headers' in result && 'ok' in result &&
		'json' in result && typeof result.json === 'function' &&
		'text' in result && typeof result.json === 'function'
	);
}

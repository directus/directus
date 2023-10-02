/**
 *
 * @param {Response} response
 * @returns {any}
 */
export async function extractData(response: Response) {
	const type = response.headers.get('Content-Type')?.toLowerCase();

	if (type?.startsWith('application/json') || type?.startsWith('application/health+json')) {
		const result = await response.json();
		if (!response.ok) throw result;
		if ('data' in result) return result.data;
		return result;
	}

	if (type?.startsWith('text/html') || type?.startsWith('text/plain')) {
		const result = await response.text();
		if (!response.ok) throw result;
		return result;
	}

	// empty body fallback
	return;
}

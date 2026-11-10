/**
 * Split a raw request URL (`req.url` / `req.originalUrl`) into its pathname and query string.
 *
 * Replaces the deprecated `url.parse`. Unlike the WHATWG `URL` it never throws and doesn't normalize the path
 * (`..`, `%2e%2e`, `//`), so the pathname stays the one the router matched against. The `scheme://authority` prefix
 * of absolute-form request targets (`GET http://host/path`) is dropped, the same way the router ignores it.
 *
 * @param requestUrl Raw request URL
 */
export function parseRequestUrl(requestUrl: string): { pathname: string; query: string | null } {
	const withoutHash = requestUrl.replace(/^[a-z][a-z\d+.-]*:\/\/[^/?#]*/i, '').split('#', 1)[0] || '';
	const queryIndex = withoutHash.indexOf('?');

	if (queryIndex === -1) return { pathname: withoutHash || '/', query: null };

	return { pathname: withoutHash.slice(0, queryIndex) || '/', query: withoutHash.slice(queryIndex + 1) };
}

/**
 * Unwrap the standard Directus API response envelope (`{ data: T }`) from a request body.
 *
 * When a user pipes the JSON output of `GET /schema/snapshot` directly into
 * `POST /schema/diff` or `POST /schema/apply`, the body is already wrapped in
 * `{ "data": <payload> }` by the respond middleware. Both the raw form and the
 * envelope form are accepted transparently.
 */
export function unwrapDataEnvelope<T extends object>(body: T | { data: T }): T {
	if (
		body !== null &&
		typeof body === 'object' &&
		'data' in body &&
		Object.keys(body).length === 1 &&
		typeof (body as { data?: unknown }).data === 'object' &&
		(body as { data?: unknown }).data !== null
	) {
		return (body as { data: T }).data;
	}

	return body as T;
}

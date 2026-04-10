/**
 * RFC 6749/7591 error with structured code for JSON serialization.
 *
 * `code` maps to the OAuth `error` field. `redirectable` controls whether
 * the controller can redirect the error back to the client's redirect_uri
 * (only safe after redirect_uri is validated against registered URIs).
 */
export class OAuthError extends Error {
	constructor(
		public status: number,
		public code: string,
		public description: string,
		public redirectable: boolean = false,
		public headers: Record<string, string> = {},
	) {
		super(description);
		this.name = 'OAuthError';
	}
}

/**
 * Paths redacted from flow data before it's saved to the run log or handed to the Log step. Event triggers put items
 * in `payload`, webhook triggers put the request body in `body`.
 */
const SECRET_FIELDS = [
	'password',
	'token',
	'tfa_secret',
	'external_identifier',
	'auth_data',
	'credentials',
	'ai_openai_api_key',
	'ai_anthropic_api_key',
	'ai_google_api_key',
	'ai_openai_compatible_api_key',
];

export const FLOW_SECRET_KEYS: string[][] = [
	['**', 'headers', 'authorization'],
	['**', 'headers', 'cookie'],
	['**', 'query', 'access_token'],
	...SECRET_FIELDS.flatMap((field) => [
		['**', 'payload', field],
		['**', 'body', field],
	]),
];

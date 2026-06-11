import { isObject } from '@directus/utils';

const KNOWN_REGISTRATION_FIELDS = new Set([
	'client_name',
	'redirect_uris',
	'grant_types',
	'response_types',
	'token_endpoint_auth_method',
	'client_uri',
	'logo_uri',
	'tos_uri',
	'policy_uri',
	'client_secret',
	'client_secret_expires_at',
]);

const OPTIONAL_URI_FIELDS = ['client_uri', 'logo_uri', 'tos_uri', 'policy_uri'] as const;
const ALLOWED_GRANT_TYPES = new Set(['authorization_code', 'refresh_token']);
const ALLOWED_RESPONSE_TYPES = new Set(['code']);
const ALLOWED_TOKEN_ENDPOINT_AUTH_METHODS = new Set(['none', 'client_secret_basic', 'client_secret_post']);

function typeOf(value: unknown): string {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	return typeof value;
}

function summarizeEnumArray(
	value: unknown,
	allowedValues: Set<string>,
): { type: string; count?: number; recognized_values?: string[]; unknown_value_count?: number } {
	if (!Array.isArray(value)) return { type: typeOf(value) };

	const stringValues = value.filter((item): item is string => typeof item === 'string');
	const recognizedValues = [...new Set(stringValues.filter((item) => allowedValues.has(item)))].sort();
	const unknownValueCount = stringValues.filter((item) => !allowedValues.has(item)).length;

	return {
		type: 'array',
		count: value.length,
		recognized_values: recognizedValues,
		unknown_value_count: unknownValueCount,
	};
}

function summarizeUris(value: unknown) {
	if (!Array.isArray(value)) return { type: typeOf(value) };

	const uris = value.slice(0, 10).map((uri) => {
		if (typeof uri !== 'string') return { type: typeOf(uri) };

		try {
			const parsed = new URL(uri);

			return {
				scheme: parsed.protocol.replace(/:$/, ''),
				hostname: parsed.hostname,
				has_path: parsed.pathname !== '/',
				has_query: parsed.search.length > 0,
				has_fragment: parsed.hash.length > 0,
				has_userinfo: parsed.username.length > 0 || parsed.password.length > 0,
			};
		} catch {
			return {
				type: 'string',
				length: uri.length,
				parseable: false,
			};
		}
	});

	return {
		type: 'array',
		count: value.length,
		uris,
	};
}

function summarizeOptionalUri(value: unknown) {
	if (value === undefined || value === null) return { present: false };
	if (typeof value !== 'string') return { present: true, type: typeOf(value) };

	try {
		const parsed = new URL(value);

		return {
			present: true,
			scheme: parsed.protocol.replace(/:$/, ''),
			hostname: parsed.hostname,
			has_query: parsed.search.length > 0,
			has_fragment: parsed.hash.length > 0,
			has_userinfo: parsed.username.length > 0 || parsed.password.length > 0,
		};
	} catch {
		return {
			present: true,
			type: 'string',
			length: value.length,
			parseable: false,
		};
	}
}

export function summarizeDcrRegistrationMetadata(body: unknown): Record<string, unknown> {
	if (!isObject(body)) {
		return {
			body_type: typeOf(body),
		};
	}

	const keys = Object.keys(body).sort();
	const clientName = body['client_name'];
	const authMethod = body['token_endpoint_auth_method'];
	const optional_uris: Record<string, unknown> = {};

	for (const field of OPTIONAL_URI_FIELDS) {
		if (field in body) {
			optional_uris[field] = summarizeOptionalUri(body[field]);
		}
	}

	return {
		body_type: 'object',
		body_keys: keys,
		unknown_fields: keys.filter((key) => !KNOWN_REGISTRATION_FIELDS.has(key)),
		client_name: {
			type: typeOf(clientName),
			present: typeof clientName === 'string' && clientName.length > 0,
			...(typeof clientName === 'string' ? { length: clientName.length } : {}),
		},
		redirect_uris: summarizeUris(body['redirect_uris']),
		grant_types: summarizeEnumArray(body['grant_types'], ALLOWED_GRANT_TYPES),
		response_types: summarizeEnumArray(body['response_types'], ALLOWED_RESPONSE_TYPES),
		token_endpoint_auth_method: {
			type: typeOf(authMethod),
			...(typeof authMethod === 'string' && ALLOWED_TOKEN_ENDPOINT_AUTH_METHODS.has(authMethod)
				? { value: authMethod }
				: {}),
			...(typeof authMethod === 'string' && !ALLOWED_TOKEN_ENDPOINT_AUTH_METHODS.has(authMethod)
				? { unknown_value: true }
				: {}),
		},
		optional_uris,
		client_secret_present: body['client_secret'] !== undefined,
		client_secret_expires_at_present: body['client_secret_expires_at'] !== undefined,
	};
}

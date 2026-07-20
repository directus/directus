const secrets = new Set<string>();

// Redacting short common values as bare substrings could corrupt ordinary output.
// The patterns below still cover short tokens in bearer headers and URLs.
const MIN_SECRET_LENGTH = 8;

export function registerSecret(value: string): void {
	if (value.length >= MIN_SECRET_LENGTH) secrets.add(value);
}

// Test/reset hook — the registry is process-global.
export function clearSecrets(): void {
	secrets.clear();
}

// Backstops for secrets embedded by dependencies before registration.
const BEARER = /(\bBearer\s+)\S+/gi;
const TOKEN_QUERY = /([?&](?:access_token|token)=)[^&\s"']+/gi;

export function redact(text: string): string {
	let out = text;

	for (const secret of secrets) {
		out = out.replaceAll(secret, '***');
	}

	return out.replace(BEARER, '$1***').replace(TOKEN_QUERY, '$1***');
}

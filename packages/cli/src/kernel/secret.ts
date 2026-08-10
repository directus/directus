const secrets = new Set<string>();

export function registerSecret(value: string): void {
	// An empty value would match between every character; every actual secret must be redacted regardless of length.
	if (value !== '') secrets.add(value);
}

/** Test/reset hook — the registry is process-global. */
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

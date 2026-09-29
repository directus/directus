const secrets = new Set<string>();

export function registerSecret(value: string): void {
	// Empty is the only rejection: it would match between every character. Short secrets still count.
	if (value !== '') secrets.add(value);
}

/** Test hook. The registry is process-global, so suites must reset it between cases. */
export function clearSecrets(): void {
	secrets.clear();
}

// Backstops for secrets a dependency embeds before anything could register them.
const BEARER = /(\bBearer\s+)\S+/gi;
const TOKEN_QUERY = /([?&](?:access_token|token)=)[^&\s"']+/gi;

export function redact(text: string): string {
	let out = text;

	for (const secret of secrets) {
		out = out.replaceAll(secret, '***');
	}

	return out.replace(BEARER, '$1***').replace(TOKEN_QUERY, '$1***');
}

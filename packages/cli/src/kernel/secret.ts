// Process-global registry of secret values (auth tokens) that must never reach
// output. The credential resolver registers a token the moment it materializes;
// the ui output boundary redacts every registered value from anything it writes.
// This is the safety net — commands are still expected not to emit secrets in
// the first place, and error mapping keeps them out of messages. Belt and braces
// because with an agent driving the CLI, stdout/stderr *is* the conversation.

const secrets = new Set<string>();

// Short values are too collision-prone to redact safely (would mangle unrelated
// output); real Directus tokens are long.
const MIN_SECRET_LENGTH = 8;

export function registerSecret(value: string): void {
	if (value.length >= MIN_SECRET_LENGTH) secrets.add(value);
}

// Test/reset hook — the registry is process-global.
export function clearSecrets(): void {
	secrets.clear();
}

// Backstops for tokens that were never registered (e.g. embedded by a dependency
// in an error string we never held the value of).
const BEARER = /(\bBearer\s+)\S+/gi;
const TOKEN_QUERY = /([?&](?:access_token|token)=)[^&\s"']+/gi;

// Replace every known secret value, plus any bearer header / token query param,
// with `***`. Applied to all output.
export function redact(text: string): string {
	let out = text;

	for (const secret of secrets) {
		out = out.replaceAll(secret, '***');
	}

	return out.replace(BEARER, '$1***').replace(TOKEN_QUERY, '$1***');
}

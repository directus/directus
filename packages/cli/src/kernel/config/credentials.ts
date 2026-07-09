import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { isCI } from '../env.js';
import { CliError } from '../error.js';
import { registerSecret } from '../secret.js';

export interface ResolvedCredential {
	readonly url: string;
	readonly token: string;
	readonly source: 'flag' | 'env' | 'store';
}

// Not-found is a valid state, not an error: in a TTY the caller prompts, and
// non-interactively it becomes a hard error naming `envVar` to set.
type CredentialResolution =
	| { readonly found: true; readonly credential: ResolvedCredential }
	| { readonly found: false; readonly envVar: string };

interface CredentialQuery {
	readonly url: string;
	readonly profileName?: string;
	readonly tokenFlag?: string;
	readonly hasConfiguredProfiles: boolean;
}

// DIRECTUS_<PROFILE>_TOKEN, mirroring how Directus derives AUTH_<PROVIDER>_* /
// STORAGE_<LOCATION>_* keys: uppercase the name, nothing else.
export function envTokenVar(profileName: string): string {
	return `DIRECTUS_${profileName.toUpperCase()}_TOKEN`;
}

// Resolution order: explicit flag → profile-specific DIRECTUS_<NAME>_TOKEN →
// unprefixed DIRECTUS_TOKEN → saved store (never in CI). The URL is resolved by
// the caller, so this stays token-focused.
export function resolveCredential(query: CredentialQuery): CredentialResolution {
	const { url, profileName, tokenFlag } = query;

	// Register the token the instant it materializes, so it is redacted from all
	// output regardless of which consumer touches it next.
	function hit(token: string, source: ResolvedCredential['source']): CredentialResolution {
		registerSecret(token);
		return { found: true, credential: { url, token, source } };
	}

	if (tokenFlag !== undefined && tokenFlag !== '') {
		return hit(tokenFlag, 'flag');
	}

	if (profileName !== undefined) {
		const specific = process.env[envTokenVar(profileName)];

		if (specific !== undefined && specific !== '') {
			return hit(specific, 'env');
		}
	}

	// The unprefixed DIRECTUS_TOKEN is disabled once config defines profiles, so a
	// token meant for one instance can't silently authenticate another (F12).
	if (!query.hasConfiguredProfiles) {
		const unprefixed = process.env['DIRECTUS_TOKEN'];

		if (unprefixed !== undefined && unprefixed !== '') {
			return hit(unprefixed, 'env');
		}
	}

	// The saved store is machine-global but never consulted in CI, so a stray dev
	// token cannot leak into an automated run.
	if (!isCI()) {
		const stored = profileName !== undefined ? readStore()[url]?.[profileName] : undefined;

		if (stored !== undefined) {
			return hit(stored, 'store');
		}
	}

	return { found: false, envVar: profileName !== undefined ? envTokenVar(profileName) : 'DIRECTUS_TOKEN' };
}

// `~/.directus/credentials.json`, machine-global across repos and worktrees.
// Shape: { "<url>": { "<profile>": "<token>" } }.
type CredentialStore = Record<string, Record<string, string>>;

function storePath(): string {
	return join(homedir(), '.directus', 'credentials.json');
}

function readStore(): CredentialStore {
	const path = storePath();
	let raw: string;

	try {
		raw = readFileSync(path, 'utf8');
	} catch (error) {
		// A missing store is the normal "nothing saved yet" case. Anything else
		// (unreadable, permissions) must NOT collapse to {} — saveCredential would
		// then overwrite a recoverable file and wipe every other saved token.
		const code = error instanceof Error && 'code' in error ? error.code : undefined;
		if (code === 'ENOENT') return {};

		const hint = error instanceof Error ? error.message : undefined;
		throw new CliError('STATE', `Cannot read credential store at ${path}.`, hint !== undefined ? { hint } : {});
	}

	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new CliError('STATE', `Credential store at ${path} is not valid JSON.`, {
			hint: 'Fix or remove the file, then retry.',
		});
	}

	// A present-but-wrong-shape store is corrupt, not empty — refuse rather than
	// silently overwrite it on the next save.
	if (!isPlainObject(parsed)) {
		throw new CliError('STATE', `Credential store at ${path} is not a JSON object.`, {
			hint: 'Fix or remove the file, then retry.',
		});
	}

	return parsed as CredentialStore;
}

// Owner-only (0600) because it holds a real token. Self-registers the token as a
// secret so it's redacted from output. Only called after an explicit "save this
// token?" confirm (never in CI).
export function saveCredential(url: string, profileName: string, token: string): void {
	registerSecret(token);

	const path = storePath();

	// Read first, outside the write try: a corrupt store must surface its precise
	// error and abort before we mkdir/write, never get rewrapped or overwritten.
	const store = readStore();
	store[url] = { ...store[url], [profileName]: token };

	try {
		mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
		writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
		// Enforce 0600 even if the file pre-existed with looser permissions.
		chmodSync(path, 0o600);
	} catch (error) {
		const hint = error instanceof Error ? error.message : undefined;
		throw new CliError('STATE', `Could not save credential to ${path}.`, hint !== undefined ? { hint } : {});
	}
}

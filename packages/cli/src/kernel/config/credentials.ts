import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { AuthenticationData, AuthenticationStorage } from '@directus/sdk';
import { isPlainObject } from 'lodash-es';
import { isCI } from '../env.js';
import { CliError } from '../error.js';
import { registerSecret } from '../secret.js';
import { writeFileAtomic } from '../write.js';

export type ResolvedCredential =
	| { readonly url: string; readonly source: 'flag' | 'env' | 'store' | 'prompt'; readonly token: string }
	| { readonly url: string; readonly source: 'session'; readonly profileName: string };

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
	readonly explicitUrl?: boolean;
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
	function hit(token: string, source: 'flag' | 'env' | 'store'): CredentialResolution {
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
	// token meant for one instance can't silently authenticate another (F12) — and
	// never applies to an explicitly-typed `--url`, so a typo can't leak it to an
	// arbitrary host. That leaves it for genuinely ambient operation only.
	if (!query.hasConfiguredProfiles && query.explicitUrl !== true) {
		const unprefixed = process.env['DIRECTUS_TOKEN'];

		if (unprefixed !== undefined && unprefixed !== '') {
			return hit(unprefixed, 'env');
		}
	}

	// The saved store is machine-global but never consulted in CI, so a stray dev
	// token cannot leak into an automated run. Only bare strings are static tokens;
	// persisted sessions are read through credentialStorage.
	if (!isCI()) {
		const stored = profileName !== undefined ? readStore()[url]?.[profileName] : undefined;

		if (typeof stored === 'string') {
			if (stored !== '') return hit(stored, 'store');
		} else if (stored !== undefined && profileName !== undefined) {
			const session = requireSession(stored, url, profileName);
			if (session.refresh_token !== null) return { found: true, credential: { url, source: 'session', profileName } };
		}
	}

	return { found: false, envVar: profileName !== undefined ? envTokenVar(profileName) : 'DIRECTUS_TOKEN' };
}

// `~/.directus/credentials.json`, machine-global across repos and worktrees.
// Shape: { "<url>": { "<profile>": StoredCredential } }.
type StoredCredential = string | AuthenticationData;
type CredentialStore = Record<string, Record<string, StoredCredential>>;

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

	const store = parsed as Record<string, unknown>;

	for (const [url, profiles] of Object.entries(store)) {
		if (!isPlainObject(profiles)) {
			throw new CliError('STATE', `Credential store entry for ${url} at ${path} is not a JSON object.`, {
				hint: 'Fix or remove that entry, then retry.',
			});
		}

		for (const [profileName, credential] of Object.entries(profiles as Record<string, unknown>)) {
			if (typeof credential === 'string') continue;
			if (isAuthenticationData(credential)) continue;
			throw invalidStoredCredential(url, profileName);
		}
	}

	return store as CredentialStore;
}

// The store is owner-only (0600); register the token before writing it.
export function saveCredential(url: string, profileName: string, token: string): void {
	registerSecret(token);
	writeStored(url, profileName, token);
}

export function clearCredential(url: string, profileName: string): void {
	writeStored(url, profileName, null);
}

export function credentialStorage(url: string, profileName: string): AuthenticationStorage {
	return {
		get() {
			const stored = readStore()[url]?.[profileName];
			if (stored === undefined || typeof stored === 'string') return null;
			const session = requireSession(stored, url, profileName);
			if (session.refresh_token === null) return null;
			registerSession(session);
			return session;
		},
		set(value: AuthenticationData | null) {
			if (value !== null) registerSession(value);
			writeStored(url, profileName, value);
		},
	};
}

function isAuthenticationData(value: unknown): value is AuthenticationData {
	if (!isPlainObject(value)) return false;

	const data = value as Record<string, unknown>;

	return (
		(typeof data['access_token'] === 'string' || data['access_token'] === null) &&
		(typeof data['refresh_token'] === 'string' || data['refresh_token'] === null) &&
		(typeof data['expires'] === 'number' || data['expires'] === null) &&
		(typeof data['expires_at'] === 'number' || data['expires_at'] === null)
	);
}

function requireSession(value: unknown, url: string, profileName: string): AuthenticationData {
	if (!isAuthenticationData(value)) throw invalidStoredCredential(url, profileName);
	return value;
}

function invalidStoredCredential(url: string, profileName: string): CliError {
	return new CliError('STATE', `Credential store entry for "${profileName}" at ${url} is not a valid session.`, {
		hint: 'Remove that entry from ~/.directus/credentials.json, then retry.',
	});
}

function registerSession(data: AuthenticationData): void {
	if (data.access_token !== null) registerSecret(data.access_token);
	if (data.refresh_token !== null) registerSecret(data.refresh_token);
}

function writeStored(url: string, profileName: string, value: StoredCredential | null): void {
	const path = storePath();

	// Read first, outside the write try: a corrupt store must surface its precise
	// error and abort before we mkdir/write, never get rewrapped or overwritten.
	const store = readStore();

	if (value === null) {
		const existing = store[url];
		if (existing === undefined || !Object.hasOwn(existing, profileName)) return;

		delete existing[profileName];
		if (Object.keys(existing).length === 0) delete store[url];
	} else {
		store[url] = { ...store[url], [profileName]: value };
	}

	try {
		mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
		writeFileAtomic(path, `${JSON.stringify(store, null, 2)}\n`, 0o600);
	} catch (error) {
		const hint = error instanceof Error ? error.message : undefined;
		throw new CliError('STATE', `Could not save credential to ${path}.`, hint !== undefined ? { hint } : {});
	}
}

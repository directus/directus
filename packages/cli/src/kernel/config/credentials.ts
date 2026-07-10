import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { AuthenticationData, AuthenticationStorage } from '@directus/sdk';
import { isPlainObject } from 'lodash-es';
import { isCI } from '../env.js';
import { CliError } from '../error.js';
import { registerSecret } from '../secret.js';
import { writeFileAtomic } from '../write.js';

// Either a bearer static token (flag/env/store/prompt) or a store-backed session
// the SDK reads and rotates. The session carries only its keys — the tokens live
// in the store, fetched by `credentialStorage` — so a JSON blob is never mistaken
// for a token.
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
	// The URL was typed explicitly (a `--url` flag) rather than resolved from config
	// or the environment. The unprefixed DIRECTUS_TOKEN is the token for the user's
	// one *ambient* instance, so it must not be borrowed for an explicit — possibly
	// mistyped or arbitrary — target, or a typo would leak it to a host they don't own.
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
	// token cannot leak into an automated run. Only bare-string entries are static
	// tokens; a persisted session (object) is resolved via `credentialStorage`.
	if (!isCI()) {
		const stored = profileName !== undefined ? readStore()[url]?.[profileName] : undefined;

		// An empty stored token is unusable — fall through to prompt rather than
		// "resolve" it and then fail authentication.
		if (typeof stored === 'string') {
			if (stored !== '') return hit(stored, 'store');
		} else if (stored !== undefined && profileName !== undefined) {
			// A persisted session (object) authenticates via the SDK's storage, not a
			// bearer token — validate its shape, then hand back its keys for `connect`
			// to rotate. A malformed object fails loud; a session with no refresh token
			// can't be refreshed, so treat it as absent.
			const session = requireSession(stored, profileName);
			if (session.refresh_token !== null) return { found: true, credential: { url, source: 'session', profileName } };
		}
	}

	return { found: false, envVar: profileName !== undefined ? envTokenVar(profileName) : 'DIRECTUS_TOKEN' };
}

// `~/.directus/credentials.json`, machine-global across repos and worktrees.
// Shape: { "<url>": { "<profile>": StoredCredential } }. A bare string is a
// static token (`saveCredential` + legacy files); an object is a persisted SDK
// session that the `authentication()` composable reads and rotates.
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

	return parsed as CredentialStore;
}

// Owner-only (0600) because it holds a real token. Self-registers the token as a
// secret so it's redacted from output. Only called after an explicit "save this
// token?" confirm (never in CI).
export function saveCredential(url: string, profileName: string, token: string): void {
	registerSecret(token);
	writeStored(url, profileName, token);
}

// Drop a profile's saved credential (static token or session) when the profile is
// removed, so re-adding the same name+URL later can't silently resurrect stale
// auth. A no-op when nothing is stored — it never creates the store file.
export function clearCredential(url: string, profileName: string): void {
	writeStored(url, profileName, null);
}

// A session-backed AuthenticationStorage for the SDK's `authentication()`
// composable: it reads the persisted session on start and writes the rotated
// tokens back after every login/refresh — so a password is never stored, only a
// revocable, self-rotating session. Bare-string (static-token) entries read back
// as null here; those authenticate via `staticToken()`, not a session.
export function credentialStorage(url: string, profileName: string): AuthenticationStorage {
	return {
		get() {
			const stored = readStore()[url]?.[profileName];
			if (stored === undefined || typeof stored === 'string') return null;
			const session = requireSession(stored, profileName);
			// No refresh token: nothing the SDK can do with it — report absent.
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

// A stored value in the session branch must match the SDK's AuthenticationData
// shape (each key present and either its type or null). A non-object (a bare
// `null` a user hand-edited in) or a present-but-malformed object is corrupt, not
// a session — failing as STATE beats crashing on property access or feeding the
// SDK bogus auth / registering an `undefined` secret.
function requireSession(value: unknown, profileName: string): AuthenticationData {
	if (!isPlainObject(value)) {
		throw new CliError('STATE', `Credential store has a malformed session for "${profileName}".`, {
			hint: 'Fix or remove the entry, then re-authenticate.',
		});
	}

	const entry = value as Record<string, unknown>;

	const valid =
		(entry['access_token'] === null || typeof entry['access_token'] === 'string') &&
		(entry['refresh_token'] === null || typeof entry['refresh_token'] === 'string') &&
		(entry['expires'] === null || typeof entry['expires'] === 'number') &&
		(entry['expires_at'] === null || typeof entry['expires_at'] === 'number');

	if (!valid) {
		throw new CliError('STATE', `Credential store has a malformed session for "${profileName}".`, {
			hint: 'Fix or remove the entry, then re-authenticate.',
		});
	}

	return value as AuthenticationData;
}

// Both tokens in a session are bearer secrets — register whichever are present so
// they're redacted the moment they enter memory, on read as well as write.
function registerSession(data: AuthenticationData): void {
	if (data.access_token !== null) registerSecret(data.access_token);
	if (data.refresh_token !== null) registerSecret(data.refresh_token);
}

// The shared read-modify-write: owner-only (0600), directory pre-created. A null
// value clears the entry (logout), pruning an emptied url so the file stays tidy.
function writeStored(url: string, profileName: string, value: StoredCredential | null): void {
	const path = storePath();

	// Read first, outside the write try: a corrupt store must surface its precise
	// error and abort before we mkdir/write, never get rewrapped or overwritten.
	const store = readStore();

	if (value === null) {
		const existing = store[url];
		// Nothing to clear: return before mkdir/write so clearing an absent entry
		// never creates or rewrites the store file.
		if (existing === undefined || !Object.hasOwn(existing, profileName)) return;

		delete existing[profileName];
		if (Object.keys(existing).length === 0) delete store[url];
	} else {
		store[url] = { ...store[url], [profileName]: value };
	}

	try {
		mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
		// Atomic + 0600: a crash mid-write must never truncate the machine-global
		// store and lose every other saved token.
		writeFileAtomic(path, `${JSON.stringify(store, null, 2)}\n`, 0o600);
	} catch (error) {
		const hint = error instanceof Error ? error.message : undefined;
		throw new CliError('STATE', `Could not save credential to ${path}.`, hint !== undefined ? { hint } : {});
	}
}

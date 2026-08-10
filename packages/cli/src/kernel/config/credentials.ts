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
	| { readonly kind: 'token'; readonly url: string; readonly token: string }
	| { readonly kind: 'session'; readonly url: string; readonly profileName: string };

type CredentialQuery =
	| {
			readonly target: 'profile';
			readonly url: string;
			readonly profileName: string;
			readonly tokenFlag?: string | undefined;
	  }
	| { readonly target: 'url'; readonly url: string; readonly tokenFlag?: string | undefined };

export function envTokenVar(profileName: string): string {
	return `DIRECTUS_${profileName.toUpperCase()}_TOKEN`;
}

/**
 * --token, then DIRECTUS_<NAME>_TOKEN, then the saved store (never in CI). No unprefixed fallback, so a
 * credential can never be borrowed for a target the user did not mean to authenticate.
 */
export function resolveCredential(query: CredentialQuery): ResolvedCredential | undefined {
	const { url, tokenFlag } = query;

	// Register before any downstream error can expose the token.
	function hit(token: string): ResolvedCredential {
		registerSecret(token);
		return { kind: 'token', url, token };
	}

	if (tokenFlag !== undefined && tokenFlag !== '') {
		return hit(tokenFlag);
	}

	if (query.target === 'url') {
		return undefined;
	}

	const { profileName } = query;
	const specific = process.env[envTokenVar(profileName)];

	if (specific !== undefined && specific !== '') {
		return hit(specific);
	}

	// Never let a developer's machine-global credential leak into CI.
	if (!isCI()) {
		const stored = readStore()[url]?.[profileName];

		if (typeof stored === 'string') {
			if (stored !== '') return hit(stored);
		} else if (stored !== undefined) {
			const session = requireSession(stored, url, profileName);
			if (session.refresh_token !== null) return { kind: 'session', url, profileName };
		}
	}

	return undefined;
}

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
		// Only a missing file means an empty store; treating other failures as empty could wipe credentials.
		const code = error instanceof Error && 'code' in error ? error.code : undefined;
		if (code === 'ENOENT') return Object.create(null) as CredentialStore;

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

	// Throw rather than treating this as empty: a later save would overwrite recoverable credentials.
	if (!isPlainObject(parsed)) {
		throw new CliError('STATE', `Credential store at ${path} is not a JSON object.`, {
			hint: 'Fix or remove the file, then retry.',
		});
	}

	const store = parsed as Record<string, unknown>;

	// Null-prototype, so a URL or profile named "__proto__" stays data.
	const clean = Object.create(null) as CredentialStore;

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

		clean[url] = Object.assign(Object.create(null) as Record<string, StoredCredential>, profiles);
	}

	return clean;
}

export function savedTokenMessage(profileName: string): string {
	return `Saved a token for "${profileName}" to the credential store.`;
}

export function saveCredential(url: string, profileName: string, token: string): void {
	registerSecret(token);
	writeStored(url, profileName, token);
}

export function clearCredential(url: string, profileName: string): void {
	writeStored(url, profileName, null);
}

/** Credentials are keyed by URL and profile name, so a rename has to move the entry too. */
export function renameCredential(url: string, from: string, to: string): void {
	const stored = readStore()[url]?.[from];

	if (stored === undefined) return;

	writeStored(url, to, stored);
	writeStored(url, from, null);
}

/** The SDK's `AuthenticationStorage`, backed by the profile credential store. */
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

/** Must run before any request that carries these tokens, or they can reach output unredacted. */
export function registerSession(data: AuthenticationData): void {
	if (data.access_token !== null) registerSecret(data.access_token);
	if (data.refresh_token !== null) registerSecret(data.refresh_token);
}

function writeStored(url: string, profileName: string, value: StoredCredential | null): void {
	const path = storePath();

	// Surface corruption before any filesystem mutation or error rewrapping.
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

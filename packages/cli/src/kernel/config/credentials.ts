import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
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
export type CredentialResolution =
	| { readonly found: true; readonly credential: ResolvedCredential }
	| { readonly found: false; readonly envVar: string };

export interface CredentialQuery {
	readonly url: string;
	readonly profileName?: string;
	readonly tokenFlag?: string;
	readonly hasConfiguredProfiles: boolean;
	// Force off the unprefixed DIRECTUS_TOKEN even when it would otherwise apply,
	// so a two-target sync can't authenticate both sides with one shared token.
	readonly allowUnprefixedToken?: boolean;
}

// DIRECTUS_<PROFILE>_TOKEN, mirroring Directus's own AUTH_<PROVIDER>_* env style.
export function envTokenVar(profileName: string): string {
	return `DIRECTUS_${profileName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_TOKEN`;
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
	const unprefixedAllowed = query.allowUnprefixedToken ?? !query.hasConfiguredProfiles;

	if (unprefixedAllowed) {
		const unprefixed = process.env['DIRECTUS_TOKEN'];

		if (unprefixed !== undefined && unprefixed !== '') {
			return hit(unprefixed, 'env');
		}
	}

	// The saved store is machine-global but never consulted in CI, so a stray dev
	// token cannot leak into an automated run.
	if (!isCI()) {
		const stored = readStoredToken(url, profileName);

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
	try {
		const parsed: unknown = JSON.parse(readFileSync(storePath(), 'utf8'));
		return typeof parsed === 'object' && parsed !== null ? (parsed as CredentialStore) : {};
	} catch {
		// Missing or unreadable store is not fatal — fall through to prompt/error.
		return {};
	}
}

function readStoredToken(url: string, profileName: string | undefined): string | undefined {
	if (profileName === undefined) return undefined;
	return readStore()[url]?.[profileName];
}

// Owner-only (0600) because it holds a real token. Only called after an explicit
// "save this token?" confirm (never in CI).
export function saveCredential(url: string, profileName: string, token: string): void {
	const dir = join(homedir(), '.directus');
	const path = join(dir, 'credentials.json');

	try {
		mkdirSync(dir, { recursive: true, mode: 0o700 });
		const store = readStore();
		store[url] = { ...store[url], [profileName]: token };
		writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
		// Enforce 0600 even if the file pre-existed with looser permissions.
		chmodSync(path, 0o600);
	} catch (error) {
		const hint = error instanceof Error ? error.message : undefined;
		throw new CliError('STATE', `Could not save credential to ${path}.`, hint !== undefined ? { hint } : {});
	}
}

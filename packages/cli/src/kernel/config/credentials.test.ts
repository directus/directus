import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCredential, credentialStorage, envTokenVar, resolveCredential, saveCredential } from './credentials.js';

const created: string[] = [];

// Point HOME at an empty temp dir so the credential store is isolated from the
// developer's real ~/.directus and from other tests.
function isolateHome(): string {
	const dir = mkdtempSync(join(tmpdir(), 'd6s-home-'));
	created.push(dir);
	vi.stubEnv('HOME', dir);
	vi.stubEnv('USERPROFILE', dir);
	return dir;
}

afterEach(() => {
	vi.unstubAllEnvs();
	for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('envTokenVar', () => {
	// Mirrors Directus's AUTH_<PROVIDER>_* / STORAGE_<LOCATION>_* derivation: uppercase
	// the name verbatim. Normalizing separators (as a prior version did) would map
	// distinct profiles onto one token var, silently sharing a credential.
	it('derives DIRECTUS_<PROFILE>_TOKEN by uppercasing the name verbatim', () => {
		expect(envTokenVar('prod')).toBe('DIRECTUS_PROD_TOKEN');
		expect(envTokenVar('my-staging')).toBe('DIRECTUS_MY-STAGING_TOKEN');
		expect(envTokenVar('my.staging')).not.toBe(envTokenVar('my-staging'));
	});
});

describe('resolveCredential', () => {
	const url = 'https://cms.example.com';

	beforeEach(() => {
		isolateHome();
		vi.stubEnv('CI', '');
	});

	it('prefers an explicit --token flag over env and store', () => {
		vi.stubEnv('DIRECTUS_PROD_TOKEN', 'from-env');

		const result = resolveCredential({ target: 'profile', url, profileName: 'prod', tokenFlag: 'from-flag' });

		expect(result).toMatchObject({ found: true, credential: { kind: 'token', token: 'from-flag' } });
	});

	it('reads the profile-specific env var', () => {
		vi.stubEnv('DIRECTUS_PROD_TOKEN', 'from-env');

		const result = resolveCredential({ target: 'profile', url, profileName: 'prod' });

		expect(result).toMatchObject({ found: true, credential: { kind: 'token', token: 'from-env' } });
	});

	it('never borrows the ambient environment for a direct --url target', () => {
		// A hand-typed URL has no profile binding, so even with tokens in the
		// environment it resolves not-found — the ambient credential can never be
		// sent to a host the user only meant to probe. --token is the only way in.
		vi.stubEnv('DIRECTUS_TOKEN', 'ambient');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', 'prod-token');

		expect(resolveCredential({ target: 'url', url })).toEqual({ found: false, envVar: undefined });
	});

	it('accepts an explicit --token for a direct --url target', () => {
		const result = resolveCredential({ target: 'url', url, tokenFlag: 'from-flag' });

		expect(result).toMatchObject({ found: true, credential: { kind: 'token', token: 'from-flag' } });
	});

	it('falls back to the saved store, but never in CI', () => {
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		saveCredential(url, 'prod', 'stored');

		expect(resolveCredential({ target: 'profile', url, profileName: 'prod' })).toMatchObject({
			found: true,
			credential: { kind: 'token', token: 'stored' },
		});

		vi.stubEnv('CI', 'true');

		expect(resolveCredential({ target: 'profile', url, profileName: 'prod' })).toEqual({
			found: false,
			envVar: 'DIRECTUS_PROD_TOKEN',
		});
	});

	it('reports not-found with the env var to set when nothing resolves', () => {
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');

		expect(resolveCredential({ target: 'profile', url, profileName: 'prod' })).toEqual({
			found: false,
			envVar: 'DIRECTUS_PROD_TOKEN',
		});
	});

	it('treats an empty stored token as absent so the prompt fallback still runs', () => {
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		saveCredential(url, 'prod', '');

		expect(resolveCredential({ target: 'profile', url, profileName: 'prod' })).toEqual({
			found: false,
			envVar: 'DIRECTUS_PROD_TOKEN',
		});
	});
});

describe('credential store integrity', () => {
	// A present-but-corrupt store must surface an error, never read as empty — a
	// silent {} would let the next saveCredential overwrite it and wipe every other
	// saved token.
	it('refuses a corrupt store instead of reading it empty or overwriting it', () => {
		const home = isolateHome();
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');

		const path = join(home, '.directus', 'credentials.json');
		mkdirSync(join(home, '.directus'), { recursive: true });
		writeFileSync(path, '{ corrupt not json');

		// Read path refuses rather than reporting not-found.
		expect(() => resolveCredential({ target: 'profile', url: 'https://cms.example.com', profileName: 'prod' })).toThrow(
			/not valid JSON/,
		);

		// Write path aborts before touching the file.
		expect(() => saveCredential('https://cms.example.com', 'prod', 'secret')).toThrow(/not valid JSON/);

		// The original bytes are intact — nothing was overwritten.
		expect(readFileSync(path, 'utf8')).toBe('{ corrupt not json');
	});

	it('refuses a corrupt URL bucket instead of treating it as missing or overwriting it', () => {
		const home = isolateHome();
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');

		const path = join(home, '.directus', 'credentials.json');
		mkdirSync(join(home, '.directus'), { recursive: true });
		writeFileSync(path, JSON.stringify({ 'https://cms.example.com': 'not-a-profile-map' }));

		expect(() => resolveCredential({ target: 'profile', url: 'https://cms.example.com', profileName: 'prod' })).toThrow(
			/not a JSON object/,
		);

		expect(() => saveCredential('https://cms.example.com', 'prod', 'secret')).toThrow(/not a JSON object/);
		expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({ 'https://cms.example.com': 'not-a-profile-map' });
	});
});

describe('credentialStorage', () => {
	const url = 'https://cms.example.com';

	const session = {
		access_token: 'access-abcdefgh',
		refresh_token: 'refresh-abcdefgh',
		expires: 900_000,
		expires_at: 1_700_000_000_000,
	};

	beforeEach(() => {
		isolateHome();
	});

	it('persists a session and reads it back for SDK rotation', () => {
		const storage = credentialStorage(url, 'prod');
		storage.set(session);

		expect(storage.get()).toEqual(session);
	});

	it('reads a static-token entry as null so staticToken handles it', () => {
		saveCredential(url, 'prod', 'static-abcdefgh');

		expect(credentialStorage(url, 'prod').get()).toBeNull();
	});

	it('resolves a stored session as session auth rather than static-token auth', () => {
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		credentialStorage(url, 'prod').set(session);

		expect(resolveCredential({ target: 'profile', url, profileName: 'prod' })).toEqual({
			found: true,
			credential: { kind: 'session', url, profileName: 'prod' },
		});
	});

	it('treats an all-null session as absent, not a usable credential', () => {
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		credentialStorage(url, 'prod').set({ access_token: null, refresh_token: null, expires: null, expires_at: null });

		expect(resolveCredential({ target: 'profile', url, profileName: 'prod' })).toEqual({
			found: false,
			envVar: 'DIRECTUS_PROD_TOKEN',
		});

		expect(credentialStorage(url, 'prod').get()).toBeNull();
	});

	it('rejects a stored null credential as STATE instead of crashing on property access', () => {
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');

		const path = join(homedir(), '.directus', 'credentials.json');
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, JSON.stringify({ [url]: { prod: null } }));

		expect(() => resolveCredential({ target: 'profile', url, profileName: 'prod' })).toThrow(/not a valid session/);

		expect(() => credentialStorage(url, 'prod').get()).toThrow(/not a valid session/);
	});

	it('refuses a malformed session entry instead of handing it to the SDK', () => {
		const home = isolateHome();
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		const path = join(home, '.directus', 'credentials.json');
		mkdirSync(join(home, '.directus'), { recursive: true });
		writeFileSync(path, JSON.stringify({ [url]: { prod: { refresh_token: 'missing-required-fields' } } }));

		expect(() => resolveCredential({ target: 'profile', url, profileName: 'prod' })).toThrow(/not a valid session/);

		expect(() => credentialStorage(url, 'prod').get()).toThrow(/not a valid session/);
	});

	it('clears only the named profile on set(null), leaving siblings intact', () => {
		// This assertion reads the store, which credential resolution intentionally skips in CI.
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', '');
		credentialStorage(url, 'prod').set(session);
		saveCredential(url, 'staging', 'static-abcdefgh');

		credentialStorage(url, 'prod').set(null);

		expect(credentialStorage(url, 'prod').get()).toBeNull();

		expect(resolveCredential({ target: 'profile', url, profileName: 'staging' })).toMatchObject({
			found: true,
			credential: { kind: 'token', token: 'static-abcdefgh' },
		});
	});
});

describe('clearCredential', () => {
	const url = 'https://cms.example.com';

	beforeEach(() => {
		isolateHome();
	});

	it('drops the named credential while leaving a sibling under the same url intact', () => {
		vi.stubEnv('CI', '');
		saveCredential(url, 'prod', 'prod-token');
		saveCredential(url, 'staging', 'staging-token');

		clearCredential(url, 'prod');

		expect(resolveCredential({ target: 'profile', url, profileName: 'prod' })).toEqual({
			found: false,
			envVar: 'DIRECTUS_PROD_TOKEN',
		});

		expect(resolveCredential({ target: 'profile', url, profileName: 'staging' })).toMatchObject({
			found: true,
			credential: { kind: 'token', token: 'staging-token' },
		});
	});

	it('is a no-op that never creates the store file when nothing is stored', () => {
		const path = join(homedir(), '.directus', 'credentials.json');

		clearCredential(url, 'prod');

		expect(existsSync(path)).toBe(false);
	});
});

describe('saveCredential', () => {
	it('writes the token 0600 so a machine-global secret is not world-readable', () => {
		const home = isolateHome();

		saveCredential('https://cms.example.com', 'prod', 'secret');

		const path = join(home, '.directus', 'credentials.json');
		const store = JSON.parse(readFileSync(path, 'utf8')) as Record<string, Record<string, string>>;
		expect(store['https://cms.example.com']?.['prod']).toBe('secret');

		// POSIX permission bits only; Windows does not model 0600.
		if (process.platform !== 'win32') {
			expect(statSync(path).mode & 0o777).toBe(0o600);
		}
	});
});

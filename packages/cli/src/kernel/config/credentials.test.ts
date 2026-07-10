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
	const base = { url: 'https://cms.example.com', hasConfiguredProfiles: true } as const;

	beforeEach(() => {
		isolateHome();
		vi.stubEnv('CI', '');
	});

	it('prefers an explicit --token flag over env and store', () => {
		vi.stubEnv('DIRECTUS_PROD_TOKEN', 'from-env');

		const result = resolveCredential({ ...base, profileName: 'prod', tokenFlag: 'from-flag' });

		expect(result).toMatchObject({ found: true, credential: { token: 'from-flag', source: 'flag' } });
	});

	it('reads the profile-specific env var', () => {
		vi.stubEnv('DIRECTUS_PROD_TOKEN', 'from-env');

		const result = resolveCredential({ ...base, profileName: 'prod' });

		expect(result).toMatchObject({ found: true, credential: { token: 'from-env', source: 'env' } });
	});

	it('disables the bare DIRECTUS_TOKEN fallback once config defines profiles (F12 guard)', () => {
		vi.stubEnv('DIRECTUS_TOKEN', 'bare');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');

		const result = resolveCredential({ ...base, profileName: 'prod', hasConfiguredProfiles: true });

		expect(result).toEqual({ found: false, envVar: 'DIRECTUS_PROD_TOKEN' });
	});

	it('allows the bare fallback for profile-less operation with no configured profiles', () => {
		vi.stubEnv('DIRECTUS_TOKEN', 'bare');

		const result = resolveCredential({ url: base.url, hasConfiguredProfiles: false });

		expect(result).toMatchObject({ found: true, credential: { token: 'bare', source: 'env' } });
	});

	it('never applies the bare DIRECTUS_TOKEN to an explicitly-typed --url target', () => {
		vi.stubEnv('DIRECTUS_TOKEN', 'bare');

		// The bare token is for the user's one ambient instance; a hand-typed --url is
		// an explicit (maybe mistyped) target, so the token must not be sent to it.
		expect(resolveCredential({ url: base.url, hasConfiguredProfiles: false, explicitUrl: true })).toEqual({
			found: false,
			envVar: 'DIRECTUS_TOKEN',
		});
	});

	it('falls back to the saved store, but never in CI', () => {
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		saveCredential(base.url, 'prod', 'stored');

		expect(resolveCredential({ ...base, profileName: 'prod' })).toMatchObject({
			found: true,
			credential: { token: 'stored', source: 'store' },
		});

		vi.stubEnv('CI', 'true');

		expect(resolveCredential({ ...base, profileName: 'prod' })).toEqual({
			found: false,
			envVar: 'DIRECTUS_PROD_TOKEN',
		});
	});

	it('reports not-found with the env var to set when nothing resolves', () => {
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');

		expect(resolveCredential({ ...base, profileName: 'prod' })).toEqual({
			found: false,
			envVar: 'DIRECTUS_PROD_TOKEN',
		});
	});

	it('treats an empty stored token as absent so the prompt fallback still runs', () => {
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		saveCredential(base.url, 'prod', '');

		// An empty token can never authenticate; reporting it "found" would block the
		// prompt with an unusable credential.
		expect(resolveCredential({ ...base, profileName: 'prod' })).toEqual({
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
		expect(() =>
			resolveCredential({ url: 'https://cms.example.com', profileName: 'prod', hasConfiguredProfiles: true }),
		).toThrow(/not valid JSON/);

		// Write path aborts before touching the file.
		expect(() => saveCredential('https://cms.example.com', 'prod', 'secret')).toThrow(/not valid JSON/);

		// The original bytes are intact — nothing was overwritten.
		expect(readFileSync(path, 'utf8')).toBe('{ corrupt not json');
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

	// The whole point of session auth: what lands on disk is a rotating refresh
	// token, not the password used to obtain it.
	it('persists a session and reads it back for the SDK to rotate', () => {
		const storage = credentialStorage(url, 'prod');
		storage.set(session);

		expect(storage.get()).toEqual(session);
	});

	// A static token and a session are distinct credential kinds; session-mode
	// reads must not misinterpret a bare-string token as an (empty) session.
	it('reads a static-token entry back as null so it routes through staticToken, not a session', () => {
		saveCredential(url, 'prod', 'static-abcdefgh');

		expect(credentialStorage(url, 'prod').get()).toBeNull();
	});

	// The mirror on the resolve side: a persisted session resolves as a session
	// credential (carrying its keys, no token), so `connect` rotates it via the
	// SDK storage instead of the chain handing a JSON blob out as a bearer token.
	it('resolves a persisted session as a session credential, not a static token', () => {
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		credentialStorage(url, 'prod').set(session);

		expect(resolveCredential({ url, profileName: 'prod', hasConfiguredProfiles: true })).toEqual({
			found: true,
			credential: { url, source: 'session', profileName: 'prod' },
		});
	});

	// A well-shaped but tokenless session can't be refreshed — it's unusable, so
	// both read paths must treat it as absent (clearable) rather than "found".
	it('treats an all-null session as absent, not a usable credential', () => {
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		credentialStorage(url, 'prod').set({ access_token: null, refresh_token: null, expires: null, expires_at: null });

		expect(resolveCredential({ url, profileName: 'prod', hasConfiguredProfiles: true })).toEqual({
			found: false,
			envVar: 'DIRECTUS_PROD_TOKEN',
		});

		expect(credentialStorage(url, 'prod').get()).toBeNull();
	});

	// A bare `null` under a profile (a hand-edit, or a truncated write) is not an
	// object; reaching property access on it would crash as an internal/unknown
	// error. Both read paths must refuse it as STATE, the same as any other
	// malformed session, rather than throwing raw.
	it('rejects a stored null credential as STATE instead of crashing on property access', () => {
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');

		const path = join(homedir(), '.directus', 'credentials.json');
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, JSON.stringify({ [url]: { prod: null } }));

		expect(() => resolveCredential({ url, profileName: 'prod', hasConfiguredProfiles: true })).toThrow(
			/malformed session/,
		);

		expect(() => credentialStorage(url, 'prod').get()).toThrow(/malformed session/);
	});

	// A hand-edited or partially-written store can hold an object that isn't a real
	// session; treating it as one would hand the SDK bogus auth state (and register
	// `undefined` as a secret). Both read paths must refuse it as STATE instead.
	it('rejects a malformed session object rather than treating it as a session', () => {
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');

		const path = join(homedir(), '.directus', 'credentials.json');
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, JSON.stringify({ [url]: { prod: { not: 'a session' } } }));

		expect(() => resolveCredential({ url, profileName: 'prod', hasConfiguredProfiles: true })).toThrow(
			/malformed session/,
		);

		expect(() => credentialStorage(url, 'prod').get()).toThrow(/malformed session/);
	});

	// Logout clears exactly one profile; a sibling credential under the same url
	// must survive so signing out of staging never logs you out of prod.
	it('clears only the named profile on set(null), leaving siblings intact', () => {
		credentialStorage(url, 'prod').set(session);
		saveCredential(url, 'staging', 'static-abcdefgh');

		credentialStorage(url, 'prod').set(null);

		expect(credentialStorage(url, 'prod').get()).toBeNull();

		expect(resolveCredential({ url, profileName: 'staging', hasConfiguredProfiles: true })).toMatchObject({
			found: true,
			credential: { token: 'static-abcdefgh', source: 'store' },
		});
	});
});

describe('clearCredential', () => {
	const url = 'https://cms.example.com';

	beforeEach(() => {
		isolateHome();
	});

	// Removing a profile must not leave its credential behind, or re-adding the same
	// name+URL would silently authenticate with a stale token the user meant to drop.
	it('drops the named credential while leaving a sibling under the same url intact', () => {
		vi.stubEnv('CI', '');
		saveCredential(url, 'prod', 'prod-token');
		saveCredential(url, 'staging', 'staging-token');

		clearCredential(url, 'prod');

		expect(resolveCredential({ url, profileName: 'prod', hasConfiguredProfiles: true })).toEqual({
			found: false,
			envVar: 'DIRECTUS_PROD_TOKEN',
		});

		expect(resolveCredential({ url, profileName: 'staging', hasConfiguredProfiles: true })).toMatchObject({
			found: true,
			credential: { token: 'staging-token', source: 'store' },
		});
	});

	// `profile remove` clears even when nothing was saved; that must stay a true
	// no-op — creating an (empty) machine-global store file as a side effect of a
	// remove would be surprising and litter ~/.directus.
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

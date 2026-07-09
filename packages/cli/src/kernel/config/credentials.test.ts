import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { envTokenVar, resolveCredential, saveCredential } from './credentials.js';

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
	it('derives DIRECTUS_<PROFILE>_TOKEN, uppercasing and normalizing separators', () => {
		expect(envTokenVar('prod')).toBe('DIRECTUS_PROD_TOKEN');
		expect(envTokenVar('my-staging')).toBe('DIRECTUS_MY_STAGING_TOKEN');
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

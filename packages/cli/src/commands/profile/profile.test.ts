import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveCredential, saveCredential } from '../../kernel/config/credentials.js';
import { run } from '../../kernel/run.js';
import { registerProfile } from './index.js';

// Drive the real dispatcher against a throwaway project dir, so these exercise
// the whole path: parse → command → config file on disk.
describe('profile commands', () => {
	let dir: string;
	let stdout: string[];
	let stderr: string[];

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-profile-'));
		stdout = [];
		stderr = [];

		vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
			stdout.push(String(chunk));
			return true;
		});

		vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
			stderr.push(String(chunk));
			return true;
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		rmSync(dir, { recursive: true, force: true });
	});

	function d6s(...argv: string[]): Promise<number> {
		return run(argv, { registerCommands: [registerProfile], cwd: dir });
	}

	function readConfig(): { profiles: Record<string, { url: string }>; [key: string]: unknown } {
		return JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
	}

	it('add creates the config file and writes the profile', async () => {
		expect(await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com')).toBe(0);
		expect(readConfig().profiles['staging']?.url).toBe('https://cms.example.com');
	});

	it('add is an upsert — re-adding the same name overwrites, not duplicates', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://one.example.com');
		await d6s('profile', 'add', 'staging', '--url', 'https://two.example.com');

		const config = readConfig();
		expect(config.profiles['staging']?.url).toBe('https://two.example.com');
		expect(Object.keys(config.profiles)).toHaveLength(1);
	});

	it('list emits the profiles as JSON on the machine channel', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');
		stdout.length = 0;

		expect(await d6s('profile', 'list', '--json')).toBe(0);
		expect(JSON.parse(stdout.join(''))).toEqual([{ name: 'staging', url: 'https://cms.example.com' }]);
	});

	it('remove deletes the named profile', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');

		expect(await d6s('profile', 'remove', 'staging')).toBe(0);
		expect(readConfig().profiles).toEqual({});
	});

	it('write preserves namespaces the kernel does not own', async () => {
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ sync: { mode: 'merge' }, profiles: {} }));

		await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');

		const config = readConfig();
		expect(config['sync']).toEqual({ mode: 'merge' });
		expect(config.profiles['staging']?.url).toBe('https://cms.example.com');
	});

	it('honors --config for writes and reads through commander global options', async () => {
		const explicit = join(dir, 'envs', 'ci.config.json');

		expect(await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com', '--config', explicit)).toBe(0);

		const written = JSON.parse(readFileSync(explicit, 'utf8'));
		expect(written.profiles['staging']?.url).toBe('https://cms.example.com');

		stdout.length = 0;
		expect(await d6s('profile', 'list', '--json', '--config', explicit)).toBe(0);
		expect(JSON.parse(stdout.join(''))).toEqual([{ name: 'staging', url: 'https://cms.example.com' }]);
	});

	it('add without a name is a usage error', async () => {
		expect(await d6s('profile', 'add', '--url', 'https://cms.example.com')).toBe(1);
	});

	it('rejects an env-unsafe profile name so DIRECTUS_<NAME>_TOKEN stays a valid var', async () => {
		expect(await d6s('profile', 'add', 'my-staging', '--url', 'https://cms.example.com')).toBe(1);
	});

	it('add with an invalid URL is a usage error', async () => {
		expect(await d6s('profile', 'add', 'staging', '--url', 'not-a-url')).toBe(1);
	});

	it('rejects a credential-bearing url instead of writing it to committable config', async () => {
		const password = 'super-secret-password';

		expect(await d6s('profile', 'add', 'staging', '--url', `https://user:${password}@cms.example.com`)).toBe(1);
		expect(stdout.join('')).not.toContain(password);
		expect(stderr.join('')).not.toContain(password);
	});

	it('clears the saved credential when a profile is removed, so re-adding cannot resurrect it', async () => {
		const home = mkdtempSync(join(tmpdir(), 'd6s-home-'));
		vi.stubEnv('HOME', home);
		vi.stubEnv('USERPROFILE', home);
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', '');

		try {
			await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');
			saveCredential('https://cms.example.com', 'staging', 'stored-token');

			expect(await d6s('profile', 'remove', 'staging')).toBe(0);

			expect(resolveCredential({ target: 'profile', url: 'https://cms.example.com', profileName: 'staging' })).toEqual({
				found: false,
				envVar: 'DIRECTUS_STAGING_TOKEN',
			});
		} finally {
			rmSync(home, { recursive: true, force: true });
		}
	});

	it('remove of an unknown profile is a config error', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');
		expect(await d6s('profile', 'remove', 'ghost')).toBe(1);
	});

	it('test names the env var to set when no token resolves', async () => {
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', '');
		vi.stubEnv('DIRECTUS_TOKEN', '');
		vi.stubEnv('CI', 'true'); // skip the credential store so the run is hermetic
		await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');

		expect(await d6s('profile', 'test', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('DIRECTUS_STAGING_TOKEN');
	});

	it('test --url does not borrow the ambient DIRECTUS_TOKEN, so a typo cannot leak it to that host', async () => {
		vi.stubEnv('DIRECTUS_TOKEN', 'ambient-secret-token');
		vi.stubEnv('CI', 'true');

		expect(await d6s('profile', 'test', '--url', 'https://oneoff.example.com', '--json')).toBe(1);

		expect(JSON.parse(stdout.join('')).error).toMatchObject({
			code: 'AUTH',
			hint: 'Pass --token to test a URL directly.',
		});

		expect(stderr.join('')).toBe('');
	});

	it('test rejects a credential-bearing --url so a secret is never used or printed', async () => {
		const password = 'super-secret-password';

		expect(await d6s('profile', 'test', '--url', `https://user:${password}@oneoff.example.com`, '--json')).toBe(1);
		expect(stdout.join('')).not.toContain(password);
		expect(stderr.join('')).not.toContain(password);
		expect(JSON.parse(stdout.join('')).error.code).toBe('USAGE');
	});

	it('test rejects a profile name combined with --url instead of guessing which target wins', async () => {
		expect(await d6s('profile', 'test', 'staging', '--url', 'https://oneoff.example.com')).toBe(1);
	});
});

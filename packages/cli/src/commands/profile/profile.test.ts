import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveCredential, saveCredential } from '../../kernel/config/credentials.js';
import { run } from '../../kernel/run.js';
import { registerProfile } from './profile.js';

describe('profile commands', () => {
	let dir: string;
	let stdout: string[];
	let stderr: string[];

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-profile-'));
		vi.stubEnv('HOME', dir);
		vi.stubEnv('USERPROFILE', dir);
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

	it('add refuses a taken name outright, so a second add can never overwrite the first', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://one.example.com');

		expect(await d6s('profile', 'add', 'staging', '--url', 'https://two.example.com', '--json')).toBe(1);

		expect(JSON.parse(stdout.join('')).error).toMatchObject({
			code: 'USAGE',
			message: 'Profile "staging" already exists.',
			hint: 'Change it instead: d6s profile update staging --url <url>',
		});

		expect(readConfig().profiles['staging']?.url).toBe('https://one.example.com');
	});

	it('update replaces the URL with --yes and clears the credential bound to the old URL', async () => {
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', '');
		await d6s('profile', 'add', 'staging', '--url', 'https://one.example.com');
		saveCredential('https://one.example.com', 'staging', 'stored-token');

		expect(await d6s('profile', 'update', 'staging', '--url', 'https://two.example.com', '--yes')).toBe(0);

		const config = readConfig();
		expect(config.profiles['staging']?.url).toBe('https://two.example.com');
		expect(Object.keys(config.profiles)).toHaveLength(1);

		expect(stderr.join('')).toContain('Overwrote the URL of "staging"');
		expect(stderr.join('')).toContain('DIRECTUS_STAGING_TOKEN');
		expect(stderr.join('')).toContain('will be cleared');

		expect(
			resolveCredential({ target: 'profile', url: 'https://one.example.com', profileName: 'staging' }),
		).toBeUndefined();
	});

	it('update refuses to move a profile to a new URL without --yes', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://one.example.com');

		expect(await d6s('profile', 'update', 'staging', '--url', 'https://two.example.com')).toBe(1);

		expect(stderr.join('')).toContain('https://one.example.com');
		expect(stderr.join('')).toContain('--yes');
		expect(stderr.join('')).toContain('DIRECTUS_STAGING_TOKEN');
		expect(readConfig().profiles['staging']?.url).toBe('https://one.example.com');
	});

	it('update of an unknown profile points at add instead of silently creating it', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');

		expect(await d6s('profile', 'update', 'ghost', '--url', 'https://new.example.com', '--json')).toBe(1);

		expect(JSON.parse(stdout.join('')).error).toMatchObject({
			code: 'USAGE',
			message: 'Unknown profile: "ghost"',
			hint: 'Create it first: d6s profile add ghost --url <url>',
		});

		expect(readConfig().profiles['ghost']).toBeUndefined();
	});

	it('update keeps the current URL when --url is omitted', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://one.example.com');

		expect(await d6s('profile', 'update', 'staging')).toBe(0);
		expect(readConfig().profiles['staging']?.url).toBe('https://one.example.com');
		expect(stderr.join('')).not.toContain('Overwrote the URL');
	});

	it('never prints a malformed legacy profile URL — the stored value bypassed schema validation', async () => {
		const password = 'super-secret-password';

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url: `https://user:${password}@old.example.com` } } }),
		);

		expect(await d6s('profile', 'update', 'staging', '--url', 'https://new.example.com')).toBe(1);

		const output = stdout.join('') + stderr.join('');
		expect(output).not.toContain(password);
		expect(stderr.join('')).toContain('<saved URL is invalid or unsafe to print>');
	});

	it('gates a profile whose stored URL is missing or mangled — existence decides, not URL validity', async () => {
		const broken = JSON.stringify({ profiles: { staging: { url: 123 } } });
		writeFileSync(join(dir, 'directus.config.json'), broken);

		expect(await d6s('profile', 'update', 'staging', '--url', 'https://new.example.com')).toBe(1);
		expect(stderr.join('')).toContain('<saved URL is invalid or unsafe to print>');

		expect(readFileSync(join(dir, 'directus.config.json'), 'utf8')).toBe(broken);

		expect(await d6s('profile', 'update', 'staging', '--url', 'https://new.example.com', '--yes')).toBe(0);
		expect(readConfig().profiles['staging']?.url).toBe('https://new.example.com');
	});

	it('update without a usable saved URL still demands one, because there is nothing to keep', async () => {
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { staging: { url: 123 } } }));

		expect(await d6s('profile', 'update', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('--url <url>');
	});

	it('rejects URLs carrying control characters the parser would silently strip or encode', async () => {
		expect(await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com/\u001b]0;pwn\u0007')).toBe(1);
		expect(await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com/a\nb')).toBe(1);
		expect(await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com/a\u0085b')).toBe(1);
		expect(await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com/a\u009bb')).toBe(1);
		expect(existsSync(join(dir, 'directus.config.json'))).toBe(false);
	});

	it('updating to the URL a profile already has stays frictionless — no confirmation, no --yes', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://one.example.com');

		expect(await d6s('profile', 'update', 'staging', '--url', 'https://one.example.com')).toBe(0);
		expect(readConfig().profiles['staging']?.url).toBe('https://one.example.com');
	});

	it('list emits the profiles as JSON on the machine channel', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');
		stdout.length = 0;

		expect(await d6s('profile', 'list', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			kind: 'ProfileListReport',
			formatVersion: 1,
			ok: true,
			profiles: [{ name: 'staging', url: 'https://cms.example.com' }],
		});
	});

	it('remove deletes the profile and its saved credential', async () => {
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', '');
		await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');
		saveCredential('https://cms.example.com', 'staging', 'stored-token');

		expect(await d6s('profile', 'remove', 'staging', '--yes')).toBe(0);
		expect(readConfig().profiles).toEqual({});

		expect(
			resolveCredential({ target: 'profile', url: 'https://cms.example.com', profileName: 'staging' }),
		).toBeUndefined();
	});

	it('refuses to remove without confirmation, because removal takes the saved credential with it', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');

		expect(await d6s('profile', 'remove', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('also clears its saved credential');
		expect(stderr.join('')).toContain('--yes');
		expect(readConfig().profiles['staging']?.url).toBe('https://cms.example.com');
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

		expect(JSON.parse(stdout.join(''))).toMatchObject({
			kind: 'ProfileListReport',
			profiles: [{ name: 'staging', url: 'https://cms.example.com' }],
		});
	});

	it('rejects each malformed invocation for its own stated reason, writing no config', async () => {
		const cases: [argv: string[], reason: RegExp][] = [
			[['profile', 'add', '--url', 'https://cms.example.com'], /Name the profile/],
			// An env-unsafe name would derive a DIRECTUS_<NAME>_TOKEN that no shell can export.
			[['profile', 'add', 'my-staging', '--url', 'https://cms.example.com'], /Invalid profile name: "my-staging"/],
			[['profile', 'add', 'staging', '--url', 'not-a-url'], /valid http\(s\) URL/],
			[['profile', 'test', 'staging', '--url', 'https://oneoff.example.com'], /not both/],
		];

		for (const [argv, reason] of cases) {
			stderr.length = 0;

			expect(await d6s(...argv)).toBe(1);
			expect(stderr.join('')).toMatch(reason);
		}

		expect(existsSync(join(dir, 'directus.config.json'))).toBe(false);
	});

	it('rejects a credential-bearing url instead of writing it to committable config', async () => {
		const password = 'super-secret-password';

		expect(await d6s('profile', 'add', 'staging', '--url', `https://user:${password}@cms.example.com`)).toBe(1);
		expect(stdout.join('')).not.toContain(password);
		expect(stderr.join('')).not.toContain(password);
	});

	it('remove of an unknown profile is a config error', async () => {
		await d6s('profile', 'add', 'staging', '--url', 'https://cms.example.com');

		expect(await d6s('profile', 'remove', 'ghost', '--yes')).toBe(1);
		expect(stderr.join('')).toContain('Unknown profile: "ghost"');
	});

	it('test names the env var to set when no token resolves', async () => {
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', '');
		vi.stubEnv('DIRECTUS_TOKEN', '');
		vi.stubEnv('CI', 'true');
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
});

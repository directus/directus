import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { type CliError, isCliError } from '../error.js';
import { loadConfig, resolveProfile } from './file.js';

const created: string[] = [];

function tempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'd6s-config-'));
	created.push(dir);
	return dir;
}

// Run fn and return the CliError it throws, so a test can assert on code/hint.
function caught(fn: () => unknown): CliError {
	try {
		fn();
	} catch (error) {
		if (isCliError(error)) return error;
		throw error;
	}

	throw new Error('expected the call to throw');
}

afterEach(() => {
	for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('loadConfig', () => {
	it('returns undefined when no config exists so profile-less operation stays first-class', () => {
		expect(loadConfig({ cwd: tempDir() })).toBeUndefined();
	});

	it('walks up from a nested subdirectory like git, so the CLI works anywhere in a project', () => {
		const root = tempDir();
		writeFileSync(join(root, 'directus.config.json'), '{ "profiles": {} }');
		const nested = join(root, 'a', 'b');
		mkdirSync(nested, { recursive: true });

		expect(loadConfig({ cwd: nested })?.path).toBe(join(root, 'directus.config.json'));
	});

	it('preserves namespaces the kernel does not own', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: {}, sync: { defaultMode: 'merge' } }));

		const loaded = loadConfig({ cwd: dir });

		// The unrecognized `sync` namespace survives for its consumer to validate.
		expect((loaded?.config as Record<string, unknown>)['sync']).toEqual({ defaultMode: 'merge' });
	});

	it('prefers an explicit configPath over walk-up discovery', () => {
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { discovered: { url: 'https://a.example.com' } } }),
		);

		const explicit = join(dir, 'other.config.json');
		writeFileSync(explicit, JSON.stringify({ profiles: { explicit: { url: 'https://b.example.com' } } }));

		expect(loadConfig({ cwd: dir, configPath: explicit })?.config.profiles['explicit']).toBeDefined();
	});

	it('reports malformed JSON as a CONFIG error rather than throwing raw', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), '{ not json');

		expect(caught(() => loadConfig({ cwd: dir })).code).toBe('CONFIG');
	});

	it('rejects a profile with an invalid url so a bad target never reaches the network', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { prod: { url: 'not-a-url' } } }));

		expect(caught(() => loadConfig({ cwd: dir })).code).toBe('CONFIG');
	});

	it('errors when an explicit --config path cannot be read instead of silently skipping', () => {
		expect(caught(() => loadConfig({ cwd: tempDir(), configPath: join(tempDir(), 'missing.json') })).code).toBe(
			'CONFIG',
		);
	});

	it('rejects a credential-bearing url so a secret never lands in committable config', () => {
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { prod: { url: 'https://user:pass@cms.example.com' } } }),
		);

		expect(caught(() => loadConfig({ cwd: dir })).code).toBe('CONFIG');
	});
});

describe('resolveProfile', () => {
	const config = {
		profiles: { prod: { url: 'https://cms.example.com', auth: { type: 'token' as const } } },
	};

	it('returns the named profile', () => {
		expect(resolveProfile(config, 'prod')).toMatchObject({ url: 'https://cms.example.com' });
	});

	it('names the known profiles on a miss so a typo is self-correcting', () => {
		expect(caught(() => resolveProfile(config, 'prd')).hint).toContain('prod');
	});

	it('hints that none are defined when the profile set is empty', () => {
		expect(caught(() => resolveProfile({ profiles: {} }, 'prod')).hint).toContain('No profiles');
	});

	it('does not match inherited object properties like "toString"', () => {
		// `'toString' in profiles` is true via the prototype; hasOwn must reject it
		// instead of returning Object.prototype.toString as a profile.
		expect(caught(() => resolveProfile(config, 'toString')).code).toBe('CONFIG');
	});
});

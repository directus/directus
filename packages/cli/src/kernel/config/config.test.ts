import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CliError } from '../error.js';
import { loadConfig, resolveProfile, upsertProfile } from './file.js';

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
		if (error instanceof CliError) return error;
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

		expect((loaded?.config as Record<string, unknown>)['sync']).toEqual({ defaultMode: 'merge' });
	});

	it('fills directory, projects, and format with defaults so a config predating them parses unchanged', () => {
		// The three CLI-owned keys must all default, or adding them would break every config already
		// committed without them.
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), '{ "profiles": {} }');

		const loaded = loadConfig({ cwd: dir });

		expect(loaded?.config.directory).toBe('directus');
		expect(loaded?.config.projects).toEqual({});
		expect(loaded?.config.format).toBe('json');
	});

	it('parses a declared project scope, keeping every scope key optional', () => {
		// A project may declare any subset of scope keys; an empty object is a valid declaration that
		// merely names a scope slot. Later slices read these to seed a sync's scope.
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ projects: { staging: { resources: ['roles'], mode: 'mirror' }, empty: {} } }),
		);

		const loaded = loadConfig({ cwd: dir });

		expect(loaded?.config.projects['staging']).toEqual({ resources: ['roles'], mode: 'mirror' });
		expect(loaded?.config.projects['empty']).toEqual({});
	});

	it('rejects an unknown key inside a project scope', () => {
		// Scope config must fail loud, not fail open: a typo'd key ("colections") silently dropped would
		// widen the pull to everything instead of the intended subset.
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ projects: { staging: { colections: ['articles'] } } }),
		);

		expect(caught(() => loadConfig({ cwd: dir })).code).toBe('CONFIG');
	});

	it('rejects format: yaml, the reserved-but-not-yet-serialized artifact format', () => {
		// format is a seam for YAML later (spec Q16); only json is valid today, so anything else must fail
		// loud rather than silently fall back to json.
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ format: 'yaml' }));

		expect(caught(() => loadConfig({ cwd: dir })).code).toBe('CONFIG');
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

	it('rejects a credential-bearing url so a secret never lands in committable config', () => {
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { prod: { url: 'https://user:pass@cms.example.com' } } }),
		);

		expect(caught(() => loadConfig({ cwd: dir })).code).toBe('CONFIG');
	});

	it('errors when an explicit --config path cannot be read instead of silently skipping', () => {
		expect(caught(() => loadConfig({ cwd: tempDir(), configPath: join(tempDir(), 'missing.json') })).code).toBe(
			'CONFIG',
		);
	});

	it('refuses to write over an existing non-object config', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), '[]');

		expect(() =>
			upsertProfile({ cwd: dir }, 'prod', { url: 'https://cms.example.com', auth: { type: 'token' } }),
		).toThrow(/not a JSON object/);
	});

	it('refuses to replace an existing non-object profiles block', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: [] }));

		expect(() =>
			upsertProfile({ cwd: dir }, 'prod', { url: 'https://cms.example.com', auth: { type: 'token' } }),
		).toThrow(/"profiles".*not an object/);
	});
});

describe('resolveProfile', () => {
	const config = {
		profiles: { prod: { url: 'https://cms.example.com', auth: { type: 'token' as const } } },
		directory: 'directus',
		projects: {},
		format: 'json' as const,
	};

	it('returns the named profile', () => {
		expect(resolveProfile(config, 'prod')).toMatchObject({ url: 'https://cms.example.com' });
	});

	it('names the known profiles on a miss so a typo is self-correcting', () => {
		expect(caught(() => resolveProfile(config, 'prd')).hint).toContain('prod');
	});

	it('hints that none are defined when the profile set is empty', () => {
		expect(
			caught(() => resolveProfile({ profiles: {}, directory: 'directus', projects: {}, format: 'json' }, 'prod')).hint,
		).toContain('No profiles');
	});

	it('does not match inherited object properties like "toString"', () => {
		expect(caught(() => resolveProfile(config, 'toString')).code).toBe('CONFIG');
	});
});

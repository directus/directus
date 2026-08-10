import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CliError } from '../error.js';
import { createConfigStore } from './file.js';

const created: string[] = [];

function tempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'd6s-config-'));
	created.push(dir);
	return dir;
}

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

describe('createConfigStore', () => {
	it('returns undefined when no configuration exists so profile-less operation stays first-class', () => {
		expect(createConfigStore(tempDir()).load()).toBeUndefined();
	});

	it('walks up from a nested subdirectory like git, so the CLI works anywhere in a project', () => {
		const root = tempDir();
		writeFileSync(join(root, 'directus.config.json'), '{ "profiles": {} }');
		const nested = join(root, 'a', 'b');
		mkdirSync(nested, { recursive: true });

		expect(createConfigStore(nested).load()?.path).toBe(join(root, 'directus.config.json'));
	});

	it('preserves namespaces the kernel does not own', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: {}, sync: { defaultMode: 'merge' } }));

		const loaded = createConfigStore(dir).load();

		expect((loaded?.config as Record<string, unknown>)['sync']).toEqual({ defaultMode: 'merge' });
	});

	it('fills directory, projects, and format with defaults so older configuration parses unchanged', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), '{ "profiles": {} }');

		const loaded = createConfigStore(dir).load();

		expect(loaded?.config.directory).toBe('directus');
		expect(loaded?.config.projects).toEqual({});
		expect(loaded?.config.format).toBe('json');
	});

	it('parses a declared project scope, keeping every scope key optional', () => {
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ projects: { staging: { resources: ['roles'], mode: 'mirror' }, empty: {} } }),
		);

		const loaded = createConfigStore(dir).load();

		expect(loaded?.config.projects['staging']).toEqual({ resources: ['roles'], mode: 'mirror' });
		expect(loaded?.config.projects['empty']).toEqual({});
	});

	it('rejects an unknown key inside a project scope', () => {
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ projects: { staging: { colections: ['articles'] } } }),
		);

		expect(caught(() => createConfigStore(dir).load()).code).toBe('CONFIG');
	});

	it('rejects an empty scope array instead of silently widening to everything', () => {
		const dir = tempDir();

		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ projects: { staging: { collections: [] } } }));

		expect(caught(() => createConfigStore(dir).load()).code).toBe('CONFIG');
	});

	it('rejects format: yaml, the reserved-but-not-yet-serialized artifact format', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ format: 'yaml' }));

		expect(caught(() => createConfigStore(dir).load()).code).toBe('CONFIG');
	});

	it('prefers an explicit configPath over walk-up discovery', () => {
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { discovered: { url: 'https://a.example.com' } } }),
		);

		const explicit = join(dir, 'other.config.json');
		writeFileSync(explicit, JSON.stringify({ profiles: { explicit: { url: 'https://b.example.com' } } }));

		const loaded = createConfigStore(dir, explicit).load();
		expect(loaded?.path).toBe(explicit);

		expect(loaded?.config.profiles).toEqual({
			explicit: { url: 'https://b.example.com', auth: { type: 'token' } },
		});
	});

	it('reports malformed JSON as a CONFIG error rather than throwing raw', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), '{ not json');

		expect(caught(() => createConfigStore(dir).load()).code).toBe('CONFIG');
	});

	it('rejects a profile with an invalid url so a bad target never reaches the network', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { prod: { url: 'not-a-url' } } }));

		expect(caught(() => createConfigStore(dir).load()).code).toBe('CONFIG');
	});

	it('rejects a credential-bearing URL so a secret never lands in local configuration', () => {
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { prod: { url: 'https://user:pass@cms.example.com' } } }),
		);

		expect(caught(() => createConfigStore(dir).load()).code).toBe('CONFIG');
	});

	it('errors when an explicit --config path cannot be read instead of silently skipping', () => {
		expect(caught(() => createConfigStore(tempDir(), join(tempDir(), 'missing.json')).load()).code).toBe('CONFIG');
	});

	it('refuses to write over existing non-object configuration', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), '[]');

		expect(() =>
			createConfigStore(dir).upsertProfile('prod', { url: 'https://cms.example.com', auth: { type: 'token' } }),
		).toThrow(/not a JSON object/);
	});

	it('refuses to replace an existing non-object profiles block', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: [] }));

		expect(() =>
			createConfigStore(dir).upsertProfile('prod', { url: 'https://cms.example.com', auth: { type: 'token' } }),
		).toThrow(/"profiles".*not an object/);
	});

	it('re-reads after its own writes, so a read later in the same run is never stale', () => {
		const dir = tempDir();
		const store = createConfigStore(dir);

		expect(store.load()).toBeUndefined();

		const write = store.upsertProfile('prod', { url: 'https://cms.example.com', auth: { type: 'token' } });
		expect(write.profile).toEqual({ url: 'https://cms.example.com', auth: { type: 'token' } });
		expect(store.load()?.config.profiles['prod']?.url).toBe('https://cms.example.com');

		expect(store.removeProfile('prod')).toEqual({ url: 'https://cms.example.com' });
		expect(store.load()?.config.profiles).toEqual({});
	});

	it('names the missing file for the commands that cannot run without one', () => {
		const error = caught(() => createConfigStore(tempDir()).requireConfig());

		expect(error.code).toBe('CONFIG');
		expect(error.message).toBe('No directus.config.json found.');
		expect(error.hint).toBe('Create one first: d6s profile add <name> --url <url>');
	});

	// A rename that appended would reorder a hand-maintained file, showing up in review as a move.
	it('renames a profile in place, leaving its neighbours where the author put them', () => {
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({
				profiles: {
					local: { url: 'https://local.example.com' },
					staging: { url: 'https://staging.example.com' },
					prod: { url: 'https://prod.example.com' },
				},
			}),
		);

		const store = createConfigStore(dir);
		const write = store.renameProfile('staging', 'preview');

		expect(write.profile).toEqual({ url: 'https://staging.example.com' });
		expect(Object.keys(store.load()!.config.profiles)).toEqual(['local', 'preview', 'prod']);
		expect(store.load()?.config.profiles['preview']?.url).toBe('https://staging.example.com');

		write.rollback();
		expect(Object.keys(store.load()!.config.profiles)).toEqual(['local', 'staging', 'prod']);
	});

	// Rebuilding the block by key means a live destination would swallow the source entry and drop a profile.
	it('refuses to rename onto a name already in use rather than dropping one of the two', () => {
		const dir = tempDir();

		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({
				profiles: { staging: { url: 'https://one.example.com' }, prod: { url: 'https://two.example.com' } },
			}),
		);

		const store = createConfigStore(dir);
		const error = caught(() => store.renameProfile('staging', 'prod'));

		expect(error.code).toBe('CONFIG');
		expect(error.message).toBe('Profile "prod" already exists.');
		expect(store.load()?.config.profiles['staging']?.url).toBe('https://one.example.com');
		expect(store.load()?.config.profiles['prod']?.url).toBe('https://two.example.com');
	});

	it('refuses to rename an unknown profile', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { prod: {} } }));

		expect(caught(() => createConfigStore(dir).renameProfile('staging', 'preview')).code).toBe('CONFIG');
	});
});

describe('requireProfile', () => {
	function storeWith(profiles: Record<string, unknown>) {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles }));
		return createConfigStore(dir);
	}

	it('names the known profiles on a miss so a typo is self-correcting', () => {
		const store = storeWith({ prod: { url: 'https://cms.example.com', auth: { type: 'token' } } });
		expect(caught(() => store.requireProfile('prd')).hint).toContain('prod');
	});

	it('hints that none are defined when the profile set is empty', () => {
		expect(caught(() => storeWith({}).requireProfile('prod')).hint).toContain('No profiles');
	});

	it('does not match inherited object properties like "toString"', () => {
		const store = storeWith({ prod: { url: 'https://cms.example.com', auth: { type: 'token' } } });
		expect(caught(() => store.requireProfile('toString')).code).toBe('CONFIG');
	});
});

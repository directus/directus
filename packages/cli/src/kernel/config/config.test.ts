import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { type CliError, isCliError } from '../error.js';
import { loadConfig } from './file.js';
import { resolveProfile } from './profiles.js';

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

	it('applies defaults and preserves namespaces the kernel does not own', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: {}, sync: { defaultMode: 'merge' } }));

		const loaded = loadConfig({ cwd: dir });

		// root default fills in...
		expect(loaded?.config.root).toBe('directus');
		// ...and the unrecognized `sync` namespace survives for its consumer to validate.
		expect((loaded?.config as Record<string, unknown>)['sync']).toEqual({ defaultMode: 'merge' });
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
});

describe('resolveProfile', () => {
	const config = {
		root: 'directus',
		profiles: { prod: { url: 'https://cms.example.com', auth: { type: 'token' as const }, protect: false } },
	};

	it('returns the named profile', () => {
		expect(resolveProfile(config, 'prod')).toMatchObject({ url: 'https://cms.example.com' });
	});

	it('names the known profiles on a miss so a typo is self-correcting', () => {
		expect(caught(() => resolveProfile(config, 'prd')).hint).toContain('prod');
	});

	it('hints that none are defined when the profile set is empty', () => {
		expect(caught(() => resolveProfile({ root: 'directus', profiles: {} }, 'prod')).hint).toContain('No profiles');
	});
});

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig } from './file.js';
import { resolveProfile } from './profiles.js';

const created: string[] = [];

function tempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'd6s-config-'));
	created.push(dir);
	return dir;
}

afterEach(() => {
	for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('loadConfig', () => {
	it('returns undefined when no config exists so profile-less operation stays first-class', () => {
		const result = loadConfig({ cwd: tempDir() });

		expect(result).toEqual({ ok: true, value: undefined });
	});

	it('walks up from a nested subdirectory like git, so the CLI works anywhere in a project', () => {
		const root = tempDir();
		writeFileSync(join(root, 'directus.config.json'), '{ "profiles": {} }');
		const nested = join(root, 'a', 'b');
		mkdirSync(nested, { recursive: true });

		const result = loadConfig({ cwd: nested });

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value?.path).toBe(join(root, 'directus.config.json'));
	});

	it('applies defaults and preserves plugin namespaces the kernel does not own', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: {}, sync: { defaultMode: 'merge' } }));

		const result = loadConfig({ cwd: dir });

		expect(result.ok).toBe(true);

		if (result.ok && result.value) {
			// root default fills in...
			expect(result.value.config.root).toBe('directus');
			// ...and the unrecognized `sync` namespace survives for its plugin to validate.
			expect((result.value.config as Record<string, unknown>)['sync']).toEqual({ defaultMode: 'merge' });
		}
	});

	it('reports malformed JSON as a CONFIG error rather than throwing', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), '{ not json');

		const result = loadConfig({ cwd: dir });

		expect(result).toMatchObject({ ok: false, error: { code: 'CONFIG' } });
	});

	it('rejects a profile with an invalid url so a bad target never reaches the network', () => {
		const dir = tempDir();
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { prod: { url: 'not-a-url' } } }));

		const result = loadConfig({ cwd: dir });

		expect(result).toMatchObject({ ok: false, error: { code: 'CONFIG' } });
	});

	it('errors when an explicit --config path cannot be read instead of silently skipping', () => {
		const result = loadConfig({ cwd: tempDir(), configPath: join(tempDir(), 'missing.json') });

		expect(result).toMatchObject({ ok: false, error: { code: 'CONFIG' } });
	});
});

describe('resolveProfile', () => {
	it('returns the named profile', () => {
		const result = resolveProfile(
			{
				root: 'directus',
				plugins: [],
				profiles: { prod: { url: 'https://cms.example.com', auth: { type: 'token' }, protect: false } },
			},
			'prod',
		);

		expect(result).toMatchObject({ ok: true, value: { url: 'https://cms.example.com' } });
	});

	it('names the known profiles on a miss so a typo is self-correcting', () => {
		const result = resolveProfile(
			{
				root: 'directus',
				plugins: [],
				profiles: { prod: { url: 'https://cms.example.com', auth: { type: 'token' }, protect: false } },
			},
			'prd',
		);

		expect(result).toMatchObject({ ok: false, error: { code: 'CONFIG' } });
		if (!result.ok) expect(result.error.hint).toContain('prod');
	});

	it('hints that none are defined when the profile set is empty', () => {
		const result = resolveProfile({ root: 'directus', plugins: [], profiles: {} }, 'prod');

		expect(result).toMatchObject({ ok: false, error: { code: 'CONFIG' } });
		if (!result.ok) expect(result.error.hint).toContain('No profiles');
	});
});

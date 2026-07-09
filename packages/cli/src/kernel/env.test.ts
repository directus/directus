import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isCI, loadProjectEnv } from './env.js';

const created: string[] = [];

function tempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'd6s-env-'));
	created.push(dir);
	return dir;
}

afterEach(() => {
	vi.unstubAllEnvs();
	for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('isCI', () => {
	it('is true when CI is set and false otherwise', () => {
		vi.stubEnv('CI', 'true');
		expect(isCI()).toBe(true);

		vi.stubEnv('CI', '');
		expect(isCI()).toBe(false);
	});
});

describe('loadProjectEnv', () => {
	it('loads a project .env into process.env without a dotenv dependency', () => {
		const dir = tempDir();
		writeFileSync(join(dir, '.env'), 'D6S_TEST_LOADED=yes\n');

		loadProjectEnv(dir);

		expect(process.env['D6S_TEST_LOADED']).toBe('yes');
		delete process.env['D6S_TEST_LOADED'];
	});

	it('does not clobber a value already set in the real environment', () => {
		const dir = tempDir();
		writeFileSync(join(dir, '.env'), 'DIRECTUS_TOKEN=from-dotenv\n');
		vi.stubEnv('DIRECTUS_TOKEN', 'from-real-env');

		loadProjectEnv(dir);

		expect(process.env['DIRECTUS_TOKEN']).toBe('from-real-env');
	});

	it('is a no-op when no .env file exists', () => {
		expect(() => loadProjectEnv(tempDir())).not.toThrow();
	});
});

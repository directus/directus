import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { pathExists } from './path-exists.js';

describe('pathExists', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'path-exists-'));
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	test('returns true for an existing directory', async () => {
		expect(await pathExists(dir)).toBe(true);
	});

	test('returns true for an existing file', async () => {
		const file = join(dir, 'file.txt');
		await writeFile(file, '');

		expect(await pathExists(file)).toBe(true);
	});

	test('returns false for a missing path', async () => {
		expect(await pathExists(join(dir, 'missing'))).toBe(false);
	});
});

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { listFolders } from './list-folders.js';

describe('listFolders', () => {
	let rootDir: string;

	beforeEach(async () => {
		rootDir = await mkdtemp(join(tmpdir(), 'list-folders-'));
	});

	afterEach(async () => {
		await rm(rootDir, { recursive: true, force: true });
	});

	test('returns all the subdirectories of the given directory', async () => {
		await mkdir(join(rootDir, 'child'));
		await writeFile(join(rootDir, 'file.txt'), '');

		expect(await listFolders(rootDir)).toStrictEqual(['child']);
	});

	test('skips hidden folders when ignoreHidden is set', async () => {
		await mkdir(join(rootDir, 'child'));
		await mkdir(join(rootDir, '.hidden'));

		expect(await listFolders(rootDir, { ignoreHidden: true })).toStrictEqual(['child']);
	});
});

import { access, rm, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { expect, test } from 'vitest';
import { createTmpFile } from './tmp.js';

test('creates an empty temp file that exists on disk', async () => {
	const tmpFile = await createTmpFile();

	try {
		await expect(access(tmpFile.path)).resolves.toBeUndefined();
		expect((await stat(tmpFile.path)).size).toBe(0);
	} finally {
		await tmpFile.cleanup();
	}
});

test('cleanup removes the file and its containing directory', async () => {
	const tmpFile = await createTmpFile();
	const dir = dirname(tmpFile.path);

	try {
		await writeFile(tmpFile.path, 'content');

		await tmpFile.cleanup();

		await expect(access(tmpFile.path)).rejects.toThrow();
		await expect(access(dir)).rejects.toThrow();
	} finally {
		// If cleanup() regressed or an assertion threw mid-way, don't leak a temp dir.
		await rm(dir, { recursive: true, force: true }).catch(() => {});
	}
});

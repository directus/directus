import { DirResult, dirSync } from 'tmp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listFolders } from './list-folders';

describe('', () => {
	let rootDir: DirResult;
	let childDir: DirResult;

	beforeEach(() => {
		rootDir = dirSync({ unsafeCleanup: true, tmpdir: './' } as any);
		childDir = dirSync({ tmpdir: rootDir.name } as any);
	});

	afterEach(() => {
		rootDir.removeCallback();
	});
	it('returns all the subdirectories of the current directory', async () => {
		const childPath = childDir.name.split('/');
		expect(await listFolders(rootDir.name)).toStrictEqual([childPath[childPath?.length - 1]]);
	});
});

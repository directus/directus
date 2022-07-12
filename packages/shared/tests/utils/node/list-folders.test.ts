import { listFolders } from '../../../src/utils/node/list-folders';
import { dirSync, DirResult } from 'tmp';

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

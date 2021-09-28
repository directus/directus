import { resolvePackage } from '.';
import { dirSync, SynchrounousResult } from 'tmp';

describe('', () => {
	let rootDir: SynchrounousResult;
	let childDir: SynchrounousResult;

	beforeEach(() => {
		rootDir = dirSync({ unsafeCleanup: true });
		childDir = dirSync({ dir: rootDir.name });
	});

	afterEach(() => {
		rootDir.removeCallback();
	});
	it('', () => {
		expect(resolvePackage('api', '')).toBe(childDir);
	});
});

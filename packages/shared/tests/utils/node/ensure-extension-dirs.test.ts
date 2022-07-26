import { ensureExtensionDirs } from '../../../src/utils/node/ensure-extension-dirs';
import { EXTENSION_TYPES } from '../../../src/constants/extensions';
import { dirSync, DirResult } from 'tmp';

describe('ensureExtensionDirs', () => {
	let rootDir: DirResult;

	beforeEach(() => {
		rootDir = dirSync({ unsafeCleanup: true });
	});

	afterEach(() => {
		rootDir.removeCallback();
	});

	it('returns undefined if the folders exist', async () => {
		expect(await ensureExtensionDirs(rootDir.name, EXTENSION_TYPES)).toBe(undefined);
	});

	it('throws an error when a folder can not be opened', () => {
		expect(async () => {
			await ensureExtensionDirs('/.', EXTENSION_TYPES);
		}).rejects.toThrow(`Extension folder "/interfaces" couldn't be opened`);
	});
});

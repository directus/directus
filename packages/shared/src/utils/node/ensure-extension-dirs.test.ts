import { ensureExtensionDirs } from '.';
import { EXTENSION_TYPES } from '../../constants/extensions';
import { ExtensionType } from '../../types';
import { dirSync, SynchrounousResult } from 'tmp';

let rootDir: SynchrounousResult;

describe('ensureExtensionDirs', () => {
	beforeEach(() => {
		rootDir = dirSync({ unsafeCleanup: true });
	});

	afterEach(() => {
		rootDir.removeCallback();
	});

	const types = EXTENSION_TYPES as readonly ExtensionType[];
	it('returns undefined if the folders exist', async () => {
		expect(await ensureExtensionDirs(rootDir.name, types)).toBe(undefined);
	});

	it('throws an error when a folder cant be opened', () => {
		expect(async () => {
			await ensureExtensionDirs('/.', types);
		}).rejects.toThrow(`Extension folder "/interfaces" couldn't be opened`);
	});
});

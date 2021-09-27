import { ensureExtensionDirs } from '.';
import { EXTENSION_TYPES } from '../../constants/extensions';
import { ExtensionType } from '../../types';
import { removeSync } from 'fs-extra';

afterEach(() => {
	removeSync('./extensionTestFolder');
});

describe('ensureExtensionDirs', () => {
	const types = EXTENSION_TYPES as readonly ExtensionType[];
	it('returns undefined if the folders exist', async () => {
		expect(await ensureExtensionDirs('./extensionTestFolder', types)).toBe(undefined);
	});

	it('throws an error when a folder cant be opened', () => {
		expect(async () => {
			await ensureExtensionDirs('/.', types);
		}).rejects.toThrow(`Extension folder "/interfaces" couldn't be opened`);
	});
});

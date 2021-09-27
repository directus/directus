import { ensureExtensionDirs } from '.';
import { EXTENSION_TYPES } from '../../constants/extensions';
import { ExtensionType } from '../../types';

describe('', () => {
	const types = EXTENSION_TYPES as readonly ExtensionType[];
	it('returns undefined if the folders exist', async () => {
		expect(await ensureExtensionDirs('./extension', types)).toBe(undefined);
	});

	it('throws an error when I folder cant be opened', () => {
		expect(async () => {
			await ensureExtensionDirs('/.', types);
		}).rejects.toThrow(`Extension folder "/interfaces" couldn't be opened`);
	});
});

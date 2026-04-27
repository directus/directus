import { describe, expect, it } from 'vitest';
import { deleteExtension, uninstallRegistryExtension } from './extensions.js';

describe('deleteExtension', () => {
	it('builds the correct DELETE request for a given UUID', () => {
		const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

		const result = deleteExtension(id)();

		expect(result).toStrictEqual({
			path: `/extensions/${id}`,
			method: 'DELETE',
		});
	});

	it('throws when id is empty', () => {
		expect(() => deleteExtension('')()).toThrow('Id cannot be empty');
	});
});

describe('uninstallRegistryExtension', () => {
	it('builds the correct DELETE request for a given UUID', () => {
		const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

		const result = uninstallRegistryExtension(id)();

		expect(result).toStrictEqual({
			path: `/extensions/registry/uninstall/${id}`,
			method: 'DELETE',
		});
	});

	it('throws when id is empty', () => {
		expect(() => uninstallRegistryExtension('')()).toThrow('Id cannot be empty');
	});
});

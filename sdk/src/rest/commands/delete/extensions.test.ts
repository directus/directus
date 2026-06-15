import { describe, expect, it } from 'vitest';
import { deleteExtension, uninstallRegistryExtension } from './extensions.js';

describe('deleteExtension', () => {
	it('throws when id is empty', () => {
		expect(() => deleteExtension('')()).toThrow('Id cannot be empty');
	});
});

describe('uninstallRegistryExtension', () => {
	it('throws when id is empty', () => {
		expect(() => uninstallRegistryExtension('')()).toThrow('Id cannot be empty');
	});
});

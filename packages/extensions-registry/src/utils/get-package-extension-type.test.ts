import { expect, test, vi } from 'vitest';
import { getPackageExtensionType } from './get-package-extension-type.js';

vi.mock('@directus/extensions', () => ({
	EXTENSION_TYPES: ['test'],
}));

test('Returns null if keywords do not contain a directus extension keyword', () => {
	expect(getPackageExtensionType([])).toBe(null);
});

test('Returns type if keywords include keyword that is prefixed with directus extension', () => {
	expect(getPackageExtensionType(['directus-extension-test', 'something-else'])).toBe('test');
});

test('Returns type if keywords include keyword that is prefixed with directus custom', () => {
	expect(getPackageExtensionType(['directus-custom-test', 'something-else'])).toBe('test');
});

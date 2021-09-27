import { validateExtensionManifest } from '.';

describe('', () => {
	it('returns false when passed item with is no name or version', () => {
		expect(validateExtensionManifest({})).toBe(false);
	});

	it('returns false when passed item with is no EXTENSION_PKG_KEY', () => {
		const mockExtension = { name: 'test', version: '0.1' };
		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item with is no type, path, source, host, or hidden', () => {
		const mockExtension = { name: 'test', version: '0.1', 'directus:extension': {} };
		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item has an invalid type', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'not_extension_type', path: './', source: 'test', host: 'localhost', hidden: true },
		};
		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns true when passed an valid ExtensionManifestRaw', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'pack', path: './', source: 'test', host: 'localhost', hidden: true },
		};
		expect(validateExtensionManifest(mockExtension)).toBe(true);
	});
});

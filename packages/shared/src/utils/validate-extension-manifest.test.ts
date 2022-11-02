import { describe, expect, it } from 'vitest';
import { validateExtensionManifest } from './validate-extension-manifest';

describe('', () => {
	it('returns false when passed item has no name or version', () => {
		expect(validateExtensionManifest({})).toBe(false);
	});

	it('returns false when passed item has no EXTENSION_PKG_KEY', () => {
		const mockExtension = { name: 'test', version: '0.1' };
		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item has no type', () => {
		const mockExtension = { name: 'test', version: '0.1', 'directus:extension': {} };
		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item has an invalid type', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'not_extension_type' },
		};
		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item has a package type and has no host', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'pack' },
		};
		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item has a hybrid type and has no path, source, host or they have the wrong format', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'operation' },
		};
		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item has an App or API type and has no path, source or host', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'interface' },
		};
		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item has a type other than pack and has no path, source or host', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'interface' },
		};
		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns true when passed a valid ExtensionManifest with an App or API type', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'interface', path: './dist/index.js', source: './src/index.js', host: '^9.0.0' },
		};
		expect(validateExtensionManifest(mockExtension)).toBe(true);
	});

	it('returns true when passed a valid ExtensionManifest with a hybrid type', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': {
				type: 'operation',
				path: { app: './dist/app.js', api: './dist/api.js' },
				source: { app: './src/app.js', api: './src/api.js' },
				host: '^9.0.0',
			},
		};
		expect(validateExtensionManifest(mockExtension)).toBe(true);
	});

	it('returns true when passed a valid ExtensionManifest with a package type', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'pack', host: '^9.0.0' },
		};
		expect(validateExtensionManifest(mockExtension)).toBe(true);
	});
});

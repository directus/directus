import { describe, expect, it } from 'vitest';
import { validateExtensionManifest, validateExtensionOptionsBundleEntry } from './validate-extension-manifest';

describe('validateExtensionManifest', () => {
	it('returns false when passed item has no name or version', () => {
		const mockExtension = {};

		expect(validateExtensionManifest(mockExtension)).toBe(false);
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

	it('returns false when passed item has no host', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'pack' },
		};

		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item has a type of bundle and has no path, entries or they have the wrong format', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'bundle', host: '^9.0.0' },
		};

		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item has a Hybrid type and has no path, source or they have the wrong format', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'operation', host: '^9.0.0' },
		};

		expect(validateExtensionManifest(mockExtension)).toBe(false);
	});

	it('returns false when passed item has an App or API type and has no path or source', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'interface', host: '^9.0.0' },
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

	it('returns true when passed a valid ExtensionManifest with a Hybrid type', () => {
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

	it('returns true when passed a valid ExtensionManifest with a type of bundle', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': {
				type: 'bundle',
				path: { app: './dist/app.js', api: './dist/api.js' },
				entries: [
					{ type: 'interface', name: 'test-interface', source: './src/test-interface/index.js' },
					{ type: 'hook', name: 'test-hook', source: './src/test-hook/index.js' },
					{
						type: 'operation',
						name: 'test-operation',
						source: { app: './src/test-operation/app.js', api: './src/test-operation/api.js' },
					},
				],
				host: '^9.0.0',
			},
		};

		expect(validateExtensionManifest(mockExtension)).toBe(true);
	});

	it('returns true when passed a valid ExtensionManifest with a Package type', () => {
		const mockExtension = {
			name: 'test',
			version: '0.1',
			'directus:extension': { type: 'pack', host: '^9.0.0' },
		};

		expect(validateExtensionManifest(mockExtension)).toBe(true);
	});
});

describe('validateExtensionOptionsBundleEntry', () => {
	it('returns false when passed item has no type', () => {
		const mockEntry = {};

		expect(validateExtensionOptionsBundleEntry(mockEntry)).toBe(false);
	});

	it('returns false when passed item has an invalid type', () => {
		const mockEntry = { type: 'bundle' };

		expect(validateExtensionOptionsBundleEntry(mockEntry)).toBe(false);
	});

	it('returns false when passed item has no name', () => {
		const mockEntry = { type: 'interface' };

		expect(validateExtensionOptionsBundleEntry(mockEntry)).toBe(false);
	});

	it('returns false when passed item has a Hybrid type and has no source or it has the wrong format', () => {
		const mockEntry = { type: 'operation', name: 'test', source: './src/index.js' };

		expect(validateExtensionOptionsBundleEntry(mockEntry)).toBe(false);
	});

	it('returns false when passed item has an App or API type and has no source', () => {
		const mockEntry = { type: 'interface', name: 'test' };

		expect(validateExtensionOptionsBundleEntry(mockEntry)).toBe(false);
	});

	it('returns true when passed a valid ExtensionOptionsBundleEntry with an App or API type', () => {
		const mockEntry = { type: 'interface', name: 'test', source: './src/index.js' };

		expect(validateExtensionOptionsBundleEntry(mockEntry)).toBe(true);
	});

	it('returns true when passed a valid ExtensionOptionsBundleEntry with a Hybrid type', () => {
		const mockEntry = { type: 'operation', name: 'test', source: { app: './src/app.js', api: './src/api.js' } };

		expect(validateExtensionOptionsBundleEntry(mockEntry)).toBe(true);
	});
});

import { describe, expect, it } from 'vitest';
import { installRegistryExtension, reinstallRegistryExtension } from './extensions.js';

describe('installRegistryExtension', () => {
	it('builds the correct POST request', () => {
		const result = installRegistryExtension('my-extension', '1.0.0')();

		expect(result).toStrictEqual({
			path: '/extensions/registry/install',
			body: JSON.stringify({ extension: 'my-extension', version: '1.0.0' }),
			method: 'POST',
		});
	});

	it('throws when extensionId is empty', () => {
		expect(() => installRegistryExtension('', '1.0.0')()).toThrow('Extension id cannot be empty');
	});

	it('throws when version is empty', () => {
		expect(() => installRegistryExtension('my-extension', '')()).toThrow('Version cannot be empty');
	});
});

describe('reinstallRegistryExtension', () => {
	it('builds the correct POST request', () => {
		const result = reinstallRegistryExtension('my-extension')();

		expect(result).toStrictEqual({
			path: '/extensions/registry/reinstall',
			body: JSON.stringify({ extension: 'my-extension' }),
			method: 'POST',
		});
	});

	it('throws when extensionId is empty', () => {
		expect(() => reinstallRegistryExtension('')()).toThrow('Extension id cannot be empty');
	});
});

import { describe, expect, it } from 'vitest';
import { installRegistryExtension } from './extensions.js';

describe('installRegistryExtension', () => {
	it('throws when extensionId is empty', () => {
		expect(() => installRegistryExtension('', '1.0.0')()).toThrow('Extension id cannot be empty');
	});

	it('throws when version is empty', () => {
		expect(() => installRegistryExtension('my-extension', '')()).toThrow('Version cannot be empty');
	});
});

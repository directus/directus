import { describe, expect, it } from 'vitest';
import { reinstallRegistryExtension, updateExtension } from './extensions.js';

describe('updateExtension', () => {
	it('throws when id is empty', () => {
		expect(() => updateExtension('', {})()).toThrow('Id cannot be empty');
	});
});

describe('reinstallRegistryExtension', () => {
	it('throws when extensionId is empty', () => {
		expect(() => reinstallRegistryExtension('')()).toThrow('Extension id cannot be empty');
	});
});

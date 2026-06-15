import { describe, expect, it } from 'vitest';
import { readRegistryAccount, readRegistryExtension } from './extensions.js';

describe('readRegistryAccount', () => {
	it('throws when pk is empty', () => {
		expect(() => readRegistryAccount('')()).toThrow('Publisher key cannot be empty');
	});
});

describe('readRegistryExtension', () => {
	it('throws when pk is empty', () => {
		expect(() => readRegistryExtension('')()).toThrow('Extension key cannot be empty');
	});
});

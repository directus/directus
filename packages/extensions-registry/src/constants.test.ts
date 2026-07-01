import { expect, test } from 'vitest';
import { DEFAULT_REGISTRY, SUPPORTED_VERSION } from './constants.js';

test('DEFAULT_REGISTRY points to the Directus registry', () => {
	expect(DEFAULT_REGISTRY).toBe('https://registry.directus.io');
});

test('SUPPORTED_VERSION is the expected API version', () => {
	expect(SUPPORTED_VERSION).toBe('2024-01-29');
});

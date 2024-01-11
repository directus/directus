import { expect, test } from 'vitest';
import { constructUrl } from './construct-url.js';

test('Defaults to npm registry', () => {
	const url = constructUrl('', {});

	expect(url.hostname).toBe('registry.npmjs.org');
	expect(url.protocol).toBe('https:');
});

test('Allows overriding registry', () => {
	const url = constructUrl('', { registry: 'https://test-registry.example.com' });

	expect(url.hostname).toBe('test-registry.example.com');
});

test('Adds passed text as query param', () => {
	const url = constructUrl('test search query', {});

	expect(url.searchParams.get('text')).toBe('test search query');
});

test('Adds passed limit as query param', () => {
	const url = constructUrl('', { limit: 5 });

	expect(url.searchParams.get('size')).toBe('5');
});

test('Adds passed offset as query param', () => {
	const url = constructUrl('', { offset: 5 });

	expect(url.searchParams.get('from')).toBe('5');
});

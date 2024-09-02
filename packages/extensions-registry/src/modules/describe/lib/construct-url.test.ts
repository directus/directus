import { expect, test, vi } from 'vitest';
import { constructUrl } from './construct-url.js';

vi.mock('../../../constants.js', () => ({
	DEFAULT_REGISTRY: 'http://example.com',
}));

test('Defaults to constant registry if registry is not set', () => {
	const url = constructUrl('test-id');

	expect(url.hostname).toBe('example.com');
	expect(url.protocol).toBe('http:');
});

test('Uses option registry if passed', () => {
	const url = constructUrl('test-id', { registry: 'http://custom-registry.example.com' });

	expect(url.hostname).toBe('custom-registry.example.com');
	expect(url.protocol).toBe('http:');
});

test('Sets path to /extensions/:id', () => {
	const url = constructUrl('test-id');

	expect(url.pathname).toBe('/extensions/test-id');
});

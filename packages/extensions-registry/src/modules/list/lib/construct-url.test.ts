import { expect, test, vi } from 'vitest';
import { constructUrl } from './construct-url.js';

vi.mock('../../../constants.js', () => ({
	DEFAULT_REGISTRY: 'http://example.com',
}));

test('Defaults to default const registry if non provided', () => {
	const url = constructUrl({});

	expect(url.hostname).toBe('example.com');
	expect(url.protocol).toBe('http:');
});

test('Uses custom registry if provided', () => {
	const url = constructUrl({}, { registry: 'https://registry.example.com' });

	expect(url.hostname).toBe('registry.example.com');
	expect(url.protocol).toBe('https:');
});

test('Retrieves data from /extensions path', () => {
	const url = constructUrl({});

	expect(url.pathname).toBe('/extensions');
});

test('Sets search query parameter if option is set', () => {
	const url = constructUrl({});
	expect(url.searchParams.get('search')).toBeNull();

	const urlWithSearch = constructUrl({ search: 'test-search-query' });
	expect(urlWithSearch.searchParams.get('search')).toBe('test-search-query');
});

test('Sets type query parameter if option is set', () => {
	const url = constructUrl({});
	expect(url.searchParams.get('type')).toBeNull();

	const urlWithSearch = constructUrl({ type: 'interface' });
	expect(urlWithSearch.searchParams.get('type')).toBe('interface');
});

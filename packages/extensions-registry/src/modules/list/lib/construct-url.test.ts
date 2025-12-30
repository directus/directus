import { constructUrl } from './construct-url.js';
import { expect, test, vi } from 'vitest';

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

test('Sets limit query parameter if option is set', () => {
	const url = constructUrl({});
	expect(url.searchParams.get('limit')).toBeNull();

	const urlWithSearch = constructUrl({ limit: 50 });
	expect(urlWithSearch.searchParams.get('limit')).toBe('50');
});

test('Sets offset query parameter if option is set', () => {
	const url = constructUrl({});
	expect(url.searchParams.get('offset')).toBeNull();

	const urlWithSearch = constructUrl({ offset: 50 });
	expect(urlWithSearch.searchParams.get('offset')).toBe('50');
});

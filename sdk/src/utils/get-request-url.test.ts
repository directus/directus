import { describe, test, expect, vi } from 'vitest';
import { getRequestUrl } from './get-request-url.js';
import * as queryToParamsModule from './query-to-params.js';

describe('getRequestUrl', () => {
	const baseUrl = new URL('https://example.com/api/');

	test('should build the correct URL with simple path', () => {
		const result = getRequestUrl(baseUrl, 'items/posts');
		expect(result.toString()).toBe('https://example.com/api/items/posts');
	});

	test('should handle paths with leading slash', () => {
		const result = getRequestUrl(baseUrl, '/items/posts');
		expect(result.toString()).toBe('https://example.com/api/items/posts');
	});

	test('should merge paths correctly when baseUrl does not end with slash', () => {
		const baseUrlNoSlash = new URL('https://example.com/api');
		const result = getRequestUrl(baseUrlNoSlash, 'items/posts');
		expect(result.toString()).toBe('https://example.com/api/items/posts');
	});

	test('should handle baseUrl that is just a domain', () => {
		const domainUrl = new URL('https://example.com');
		const result = getRequestUrl(domainUrl, 'items/posts');
		expect(result.toString()).toBe('https://example.com/items/posts');
	});

	test('should add basic query parameters', () => {
		const params = {
			foo: 'bar',
			num: 42,
			bool: true,
		};
		const result = getRequestUrl(baseUrl, 'items', params);
		const searchParams = result.searchParams;
		expect(searchParams.get('foo')).toBe('bar');
		expect(searchParams.get('num')).toBe('42');
		expect(searchParams.get('bool')).toBe('true');
	});

	test('should handle array parameters (e.g., sort)', () => {
		const params = {
			sort: ['name', '-created_at'],
		};
		const result = getRequestUrl(baseUrl, 'items', params);
		expect(result.searchParams.get('sort')).toBe('name,-created_at');
	});

	test('should handle nested parameters via queryToParams (JSON formatted)', () => {
		const params = {
			filter: { status: { _eq: 'published' } },
		};
		const result = getRequestUrl(baseUrl, 'items', params);
		expect(result.searchParams.get('filter')).toBe('{"status":{"_eq":"published"}}');
	});

	test('should handle nested fields with dot notation', () => {
		const params = {
			fields: ['id', { author: ['name'] }],
		};
		const result = getRequestUrl(baseUrl, 'items', params);
		expect(result.searchParams.get('fields')).toBe('id,author.name');
	});

	test('should handle custom parameters with dot notation in keys', () => {
		const params = {
			'custom.key': 'value',
		};
		const result = getRequestUrl(baseUrl, 'items', params);
		expect(result.searchParams.get('custom.key')).toBe('value');
	});

	test('should handle nested objects in custom params (currently JSON stringified by queryToParams)', () => {
		const params = {
			custom: { nested: 'value' },
		};
		const result = getRequestUrl(baseUrl, 'items', params);
		expect(result.searchParams.get('custom')).toBe('{"nested":"value"}');
	});
});

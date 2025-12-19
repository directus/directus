import { describe, it, expect } from 'vitest';
import { parseQueryParams } from './parse-query-params.js';

describe('parseQueryParams', () => {
	it('should return the same object if queryToParams succeeds (basic fields)', () => {
		const query = {
			fields: ['id', 'name'],
			filter: { status: { _eq: 'published' } },
			sort: ['-date_created'],
		};

		const result = parseQueryParams(query);

		expect(result).toEqual({
			fields: 'id,name',
			filter: '{"status":{"_eq":"published"}}',
			sort: '-date_created',
		});
	});

	it('should handle nested fields correctly', () => {
		const query = {
			fields: ['id', { user: ['id', 'first_name'] }],
		};

		const result = parseQueryParams(query);

		expect(result).toEqual({
			fields: 'id,user.id,user.first_name',
		});
	});

	it('should handle custom query parameters', () => {
		const query = {
			custom: 'value',
			another: 123,
			deep: { some: 'thing' },
		};

		const result = parseQueryParams(query);

		expect(result).toEqual({
			custom: 'value',
			another: '123',
			deep: '{"some":"thing"}',
		});
	});

	it('should return the original query if queryToParams fails', () => {
		const circular: any = {};
		circular.self = circular;

		const query = {
			filter: circular,
		};

		const result = parseQueryParams(query);

		// Should return the original query object on error
		expect(result).toBe(query);
	});

	it('should handle empty query', () => {
		const query = {};
		const result = parseQueryParams(query);
		expect(result).toEqual({});
	});

	it('should handle null/undefined fields (backwards compatibility/robustness)', () => {
		const query = {
			fields: null as any,
			filter: undefined as any,
		};

		const result = parseQueryParams(query);
		expect(result).toEqual({});
	});
});

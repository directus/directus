import { describe, test, expect } from 'vitest';
import { queryToParams, formatFields } from './query-to-params.js';

describe('formatFields', () => {
	test('should format simple string fields', () => {
		const result = formatFields(['id', 'name', 'email']);
		expect(result).toEqual(['id', 'name', 'email']);
	});

	test('should handle empty arrays', () => {
		const result = formatFields([]);
		expect(result).toEqual([]);
	});

	test('should format nested object fields', () => {
		const result = formatFields([
			'id',
			{
				author: ['name', 'email'],
			},
		]);

		expect(result).toEqual(['id', 'author.name', 'author.email']);
	});

	test('should format many-to-any nested fields with scope', () => {
		const result = formatFields([
			{
				blocks: {
					header: ['title', 'description'],
					footer: ['title'],
				},
			},
		]);

		expect(result).toEqual(['blocks:header.title', 'blocks:header.description', 'blocks:footer.title']);
	});

	test('should handle complex nested structure with multiple levels', () => {
		const result = formatFields([
			'id',
			{
				author: [
					'name',
					{
						avatar: ['id', 'url'],
					},
				],
				categories: ['name', 'slug'],
			},
		]);

		expect(result).toEqual([
			'id',
			'author.name',
			'author.avatar.id',
			'author.avatar.url',
			'categories.name',
			'categories.slug',
		]);
	});
});

describe('queryToParams', () => {
	describe('query.fields', () => {
		test('should format fields parameter', () => {
			const result = queryToParams({
				fields: ['id', 'name', { author: ['name'] }],
			});

			expect(result).toEqual({
				fields: 'id,name,author.name',
			});
		});

		test('should skip empty fields array', () => {
			const result = queryToParams({
				fields: [],
			});

			expect(result).toEqual({});
		});

		test('should accept a direct string (type workaround)', () => {
			const result = queryToParams({
				// @ts-ignore
				fields: 'id,name',
			});

			expect(result).toEqual({ fields: 'id,name' });
		});
	});

	describe('query.filter', () => {
		test('should JSON format filter parameter', () => {
			const result = queryToParams({
				filter: {
					status: { _eq: 'published' },
				},
			});

			expect(result).toEqual({
				filter: '{"status":{"_eq":"published"}}',
			});
		});

		test('should skip empty filter object', () => {
			const result = queryToParams({
				filter: {},
			});

			expect(result).toEqual({});
		});

		test('should skip undefined filter', () => {
			const result = queryToParams({
				filter: undefined,
			});
			
			expect(result).toEqual({});
		});
	});

	describe('query.search', () => {
		test('should format search parameter', () => {
			const result = queryToParams({
				search: 'test query',
			});

			expect(result).toEqual({
				search: 'test query',
			});
		});

		test('should skip empty string search', () => {
			const result = queryToParams({
				search: '',
			});

			expect(result).toEqual({});
		});

		test('should skip undefined search', () => {
			const result = queryToParams({
				search: undefined,
			});

			expect(result).toEqual({});
		});
	});

	describe('query.sort', () => {
		test('should format sort parameter as string', () => {
			const result = queryToParams({
				sort: 'name',
			});

			expect(result).toEqual({
				sort: 'name',
			});
		});

		test('should format sort parameter as array', () => {
			const result = queryToParams({
				sort: ['name', '-created_at'],
			});

			expect(result).toEqual({
				sort: 'name,-created_at',
			});
		});

		test('should skip empty sort array', () => {
			const result = queryToParams({
				sort: [],
			});

			expect(result).toEqual({});
		});

		test('should skip undefined sort', () => {
			const result = queryToParams({
				sort: undefined,
			});

			expect(result).toEqual({});
		});
	});

	describe('query.limit', () => {
		test('should format numeric limit parameter', () => {
			const result = queryToParams({
				limit: 10,
			});

			expect(result).toEqual({
				limit: '10',
			});
		});

		test('should format numeric limit -1 (all items)', () => {
			const result = queryToParams({
				limit: -1,
			});

			expect(result).toEqual({
				limit: '-1',
			});
		});

		test('should skip invalid egative numeric limit', () => {
			const result = queryToParams({
				limit: -5,
			});

			expect(result).toEqual({});
		});

		test('should format string limit parameter', () => {
			const result = queryToParams({
				// @ts-ignore
				limit: '10',
			});

			expect(result).toEqual({
				limit: '10',
			});
		});

		test('should skip invalid negative string limit', () => {
			const result = queryToParams({
				// @ts-ignore
				limit: '-5',
			});

			expect(result).toEqual({});
		});

		test('should skip undefined limit', () => {
			const result = queryToParams({
				limit: undefined,
			});
			
			expect(result).toEqual({});
		});
	});

	describe('query.offset', () => {
		test('should format numeric offset parameter', () => {
			const result = queryToParams({
				offset: 20,
			});

			expect(result).toEqual({
				offset: '20',
			});
		});

		test('should skip negative numeric offset', () => {
			const query = {
				offset: -1,
			};

			const result = queryToParams(query);
			expect(result).toEqual({});
		});
		
		test('should format string offset parameter', () => {
			const result = queryToParams({
				// @ts-ignore
				offset: '20',
			});

			expect(result).toEqual({
				offset: '20',
			});
		});

		test('should skip negative string offset', () => {
			const result = queryToParams({
				// @ts-ignore
				offset: '-1',
			});

			expect(result).toEqual({});
		});

		test('should skip undefined offset', () => {
			const result = queryToParams({
				offset: undefined,
			});

			expect(result).toEqual({});
		});
	});

	describe('query.page', () => {
		test('should format numeric page parameter', () => {
			const result = queryToParams({
				page: 2,
			});

			expect(result).toEqual({
				page: '2',
			});
		});

		test('should skip numeric page less than 1', () => {
			const result = queryToParams({
				page: 0,
			});

			expect(result).toEqual({});
		});

		test('should format string page parameter', () => {
			const result = queryToParams({
				// @ts-ignore
				page: '2',
			});

			expect(result).toEqual({
				page: '2',
			});
		});

		test('should skip string page less than 1', () => {
			const result = queryToParams({
				// @ts-ignore
				page: '0',
			});

			expect(result).toEqual({});
		});

		test('should skip undefined page', () => {
			const result = queryToParams({
				page: undefined,
			});
			
			expect(result).toEqual({});
		});
	})

	describe('query.deep', () => {
		test('should JSON format deep parameter', () => {
			const result = queryToParams({
				deep: {
					author: {
						_filter: { status: { _eq: 'active' } },
					},
				},
			});

			expect(result).toEqual({
				deep: '{"author":{"_filter":{"status":{"_eq":"active"}}}}',
			});
		});

		test('should skip empty deep object', () => {
			const result = queryToParams({
				deep: {},
			});

			expect(result).toEqual({});
		});

		test('should skip undefined deep object', () => {
			const result = queryToParams({
				deep: undefined,
			});
			
			expect(result).toEqual({});
		});
	});

	describe('query.alias', () => {
		test('should JSON format alias parameter', () => {
			const result = queryToParams({
				alias: {
					author_name: 'author.name',
				},
			});

			expect(result).toEqual({
				alias: '{"author_name":"author.name"}',
			});
		});

		test('should skip empty alias object', () => {
			const result = queryToParams({
				alias: {},
			});

			expect(result).toEqual({});
		});

		test('should skip undefined alias object', () => {
			const result = queryToParams({
				alias: undefined,
			});
			
			expect(result).toEqual({});
		});
	});

	describe('query.aggregate', () => {
		test('should JSON format aggregate parameter', () => {
			const result = queryToParams({
				aggregate: {
					count: '*',
					avg: 'price',
				},
			});

			expect(result).toEqual({
				aggregate: '{"count":"*","avg":"price"}',
			});
		});

		test('should skip empty aggregate object', () => {
			const result = queryToParams({
				aggregate: {},
			});

			expect(result).toEqual({});
		});

		test('should skip undefined aggregate object', () => {
			// @ts-ignore
			const result = queryToParams({
				aggregate: undefined,
			});
			
			expect(result).toEqual({});
		});
	});

	describe('query.groupBy', () => {
		test('should format groupBy parameter', () => {
			const result = queryToParams({
				groupBy: ['category', 'status'],
			});

			expect(result).toEqual({
				groupBy: 'category,status',
			});
		});

		test('should format string groupBy parameter', () => {
			const result = queryToParams({
				// @ts-ignore
				groupBy: 'category',
			});

			expect(result).toEqual({
				groupBy: 'category',
			});
		});

		test('should skip empty groupBy array', () => {
			const result = queryToParams({
				groupBy: [],
			});

			expect(result).toEqual({});
		});

		test('should skip empty string groupBy array', () => {
			const result = queryToParams({
				// @ts-ignore
				groupBy: '',
			});
			
			expect(result).toEqual({});
		});
	});

	describe('custom query properties', () => {
		test('should handle various custom unknown parameters', () => {
			const result = queryToParams({
				customString: 'value',
				customNumber: 42,
				customBool: true,
				customObject: { key: 'value' },
			});

			expect(result).toEqual({
				customString: 'value',
				customNumber: '42',
				customBool: 'true',
				customObject: '{"key":"value"}',
			});
		});
	});
});
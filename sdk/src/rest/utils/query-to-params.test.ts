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
	test('should skip undefined parameters', () => {
		// @ts-ignore
		const result = queryToParams({
			fields: undefined,
			filter: undefined,
			search: undefined,
			sort: undefined,
			limit: undefined,
			offset: undefined,
			page: undefined,
			deep: undefined,
			alias: undefined,
			aggregate: undefined,
			groupBy: undefined,
			version: undefined,
			versionRaw: undefined,
			customProp: undefined,
		});

		expect(result).toEqual({});
	});

	test('should skip empty or invalid parameters', () => {
		const result1 = queryToParams({
			fields: [],
			filter: {},
			search: '',
			sort: [],
			limit: -5,
			offset: -1,
			page: 0,
			deep: {},
			alias: {},
			aggregate: {},
			groupBy: [],
			version: '',
			customProp: () => {},
		});

		const result2 = queryToParams({
			// @ts-ignore
			fields: '',
			sort: '',
			// @ts-ignore
			groupBy: '',
		});

		expect(result1).toEqual({});
		expect(result2).toEqual({});
	});

	test('should accept strings as type workaround', () => {
		const result = queryToParams({
			// @ts-ignore
			fields: 'id,name',
			// @ts-ignore
			limit: '10',
			// @ts-ignore
			offset: '20',
			// @ts-ignore
			page: '2',
			// @ts-ignore
			groupBy: 'category',
			// @ts-ignore
			versionRaw: 'true',
		});

		expect(result).toEqual({
			fields: 'id,name',
			limit: '10',
			offset: '20',
			page: '2',
			groupBy: 'category',
			versionRaw: 'true',
		});
	});

	test('should format query.fields parameter', () => {
		const result = queryToParams({
			fields: ['id', 'name', { author: ['name'] }],
		});

		expect(result).toEqual({
			fields: 'id,name,author.name',
		});
	});

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

	test('should format search parameter', () => {
		const result = queryToParams({
			search: 'test query',
		});

		expect(result).toEqual({
			search: 'test query',
		});
	});

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

	test('should format numeric offset parameter', () => {
		const result = queryToParams({
			offset: 20,
		});

		expect(result).toEqual({
			offset: '20',
		});
	});

	test('should format numeric page parameter', () => {
		const result = queryToParams({
			page: 2,
		});

		expect(result).toEqual({
			page: '2',
		});
	});

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

	test('should format groupBy parameter', () => {
		const result = queryToParams({
			groupBy: ['category', 'status'],
		});

		expect(result).toEqual({
			groupBy: 'category,status',
		});
	});

	test('should format version parameter', () => {
		const result = queryToParams({
			version: 'draft',
		});

		expect(result).toEqual({
			version: 'draft',
		});
	});

	test('should format versionRaw parameter', () => {
		const result = queryToParams({
			versionRaw: true,
		});

		expect(result).toEqual({
			versionRaw: 'true',
		});
	});

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

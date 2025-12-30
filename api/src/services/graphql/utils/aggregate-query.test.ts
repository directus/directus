import { getAggregateQuery } from './aggregate-query.js';
import * as filterReplaceM2AMod from './filter-replace-m2a.js';
import * as replaceFuncsMod from './replace-funcs.js';
import * as sanitizeQueryMod from '../../../utils/sanitize-query.js';
import * as validateQueryMod from '../../../utils/validate-query.js';
import { RelationBuilder, SchemaBuilder } from '@directus/schema-builder';
import type { Query } from '@directus/types';
import type { FieldNode, SelectionNode } from 'graphql';
import { afterEach, describe, expect, test, vi } from 'vitest';

const sanitizeQuerySpy = vi.spyOn(sanitizeQueryMod, 'sanitizeQuery');
const validateQuerySpy = vi.spyOn(validateQueryMod, 'validateQuery');
const replaceFuncsSpy = vi.spyOn(replaceFuncsMod, 'replaceFuncs');
const filterReplaceM2ASpy = vi.spyOn(filterReplaceM2AMod, 'filterReplaceM2A');

const schema = new SchemaBuilder()
	.collection('article', (c) => {
		c.field('id').id();
		c.field('title').string();

		c.field('blocks').m2a(['text', 'image'], () => ({
			o2m_relation: new RelationBuilder('article', 'blocks').o2m('article_builder', 'article_id').options({
				meta: {
					junction_field: `anyitem`,
				},
			}),
			a2o_relation: new RelationBuilder('article_builder', 'anyitem').a2o(['text', 'image']).options({
				meta: {
					junction_field: `article_id`,
				},
			}),
		}));
	})
	.build();

describe('getAggregateQuery', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('basic functionality', () => {
		test('should return a query with empty aggregate object when no selections provided', async () => {
			const result = await getAggregateQuery({}, [], schema);

			expect(result).toEqual({
				aggregate: {},
			});
		});

		test('should call sanitizeQuery with correct parameters', async () => {
			const rawQuery: Query = { limit: 10 };

			await getAggregateQuery(rawQuery, [], schema);
			expect(sanitizeQuerySpy).toHaveBeenCalledWith(rawQuery, schema, undefined);
		});

		test('should validate final query', async () => {
			const result = await getAggregateQuery({}, [], schema);

			expect(validateQuerySpy).toHaveBeenCalledWith(result);
		});
	});

	describe('selection processing', () => {
		test('should skip non-Field selection nodes', async () => {
			const selections: SelectionNode[] = [
				{
					kind: 'FragmentSpread',
					name: { value: 'someFragment' },
				} as unknown as FieldNode,
				{
					kind: 'Field',
					name: { value: 'count' },
					selectionSet: {
						selections: [{ kind: 'Field', name: { value: 'id' } } as FieldNode],
					},
				} as unknown as FieldNode,
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id'],
			});
		});

		test('should filter out __ fields (graphql pointers)', async () => {
			const selections: SelectionNode[] = [
				{
					kind: 'Field',
					name: { value: '__typename' },
					selectionSet: {
						selections: [],
					},
				} as unknown as FieldNode,
				{
					kind: 'Field',
					name: { value: 'count' },
					selectionSet: {
						selections: [{ kind: 'Field', name: { value: 'id' } } as FieldNode],
					},
				} as unknown as FieldNode,
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id'],
			});

			expect(result.aggregate).not.toHaveProperty('__typename');
		});

		test('should group like field node selections into aggregate properties', async () => {
			const selections: SelectionNode[] = [
				{
					kind: 'Field',
					name: { value: 'count' },
					selectionSet: {
						selections: [
							{ kind: 'Field', name: { value: 'id' } } as FieldNode,
							{ kind: 'Field', name: { value: 'name' } } as FieldNode,
						],
					},
				} as unknown as FieldNode,
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id', 'name'],
			});
		});

		test('should handle multiple aggregation groups', async () => {
			const selections: SelectionNode[] = [
				{
					kind: 'Field',
					name: { value: 'count' },
					selectionSet: {
						selections: [{ kind: 'Field', name: { value: 'id' } } as FieldNode],
					},
				} as unknown as FieldNode,
				{
					kind: 'Field',
					name: { value: 'sum' },
					selectionSet: {
						selections: [{ kind: 'Field', name: { value: 'price' } } as FieldNode],
					},
				} as unknown as FieldNode,
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id'],
				sum: ['price'],
			});
		});

		test('should filter out __ field selections', async () => {
			const selections: SelectionNode[] = [
				{
					kind: 'Field',
					name: { value: 'count' },
					selectionSet: {
						selections: [
							{ kind: 'Field', name: { value: '__typename' } } as FieldNode,
							{ kind: 'Field', name: { value: 'id' } } as FieldNode,
							{ kind: 'Field', name: { value: '__schema' } } as FieldNode,
							{ kind: 'Field', name: { value: 'name' } } as FieldNode,
						],
					},
				} as unknown as FieldNode,
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id', 'name'],
			});
		});

		test('should handle field nodes without a selectionSet', async () => {
			const selections: SelectionNode[] = [
				{
					kind: 'Field',
					name: { value: 'count' },
				} as FieldNode,
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: [],
			});
		});

		test('should handle field nodes with an empty selectionSet', async () => {
			const selections: SelectionNode[] = [
				{
					kind: 'Field',
					name: { value: 'count' },
					selectionSet: {
						selections: [],
					},
				} as unknown as FieldNode,
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: [],
			});
		});
	});

	describe('filter processing', () => {
		test('should not call replaceFuncs when query has no filter', async () => {
			await getAggregateQuery({}, [], schema);

			expect(replaceFuncsSpy).not.toHaveBeenCalled();
		});

		test('should call replaceFuncs when query has filter', async () => {
			const filter = { date_published_func: { year: { _eq: 1968 } } };

			const result = await getAggregateQuery({ filter }, [], schema);

			expect(replaceFuncsSpy).toHaveBeenCalledWith(filter);

			expect(result).toStrictEqual({
				filter: {
					'year(date_published)': { _eq: 1968 },
				},
				aggregate: {},
			});
		});

		test('should not call filterReplaceM2A when collection is not provided', async () => {
			const filter = { field: { _eq: 'value' } };

			await getAggregateQuery({ filter }, [], schema);

			expect(filterReplaceM2ASpy).not.toHaveBeenCalled();
		});

		test('should not call filterReplaceM2A when filter is not present', async () => {
			const collection = 'article';

			await getAggregateQuery({}, [], schema, undefined, collection);

			expect(filterReplaceM2ASpy).not.toHaveBeenCalled();
		});

		test('should call filterReplaceM2A when collection and filter are provided', async () => {
			const filter = { field: { _eq: 'value' } };
			const collection = 'article';

			const result = await getAggregateQuery({ filter }, [], schema, undefined, collection);

			expect(filterReplaceM2ASpy).toHaveBeenCalledWith(filter, collection, schema);
			expect(result).toEqual({ filter, aggregate: {} });
		});

		test('should replace M2A fields when collection and filter are provided', async () => {
			const filter = { blocks: { anyitem__text: { title: { _eq: 'Lorem' } } } };
			const collection = 'article';

			const result = await getAggregateQuery({ filter }, [], schema, undefined, collection);

			expect(result).toEqual({
				filter: {
					blocks: { 'anyitem:text': { title: { _eq: 'Lorem' } } },
				},
				aggregate: {},
			});
		});
	});
});

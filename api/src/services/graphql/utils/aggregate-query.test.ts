import { RelationBuilder, SchemaBuilder } from '@directus/schema-builder';
import type { Query } from '@directus/types';
import type { FragmentDefinitionNode } from 'graphql';
import { buildSchema } from 'graphql';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	buildField,
	buildFragmentDefinition,
	buildFragmentSpread,
	buildResolveInfo,
} from '../../../test-utils/graphql.js';
import * as sanitizeQueryMod from '../../../utils/sanitize-query.js';
import * as validateQueryMod from '../../../utils/validate-query.js';
import { getAggregateQuery } from './aggregate-query.js';
import { buildSelections } from './build-selections.js';
import * as filterReplaceM2AMod from './filter-replace-m2a.js';
import * as replaceFuncsMod from './replace-funcs.js';

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
			const selections = [buildFragmentSpread('someFragment'), buildField('count', { children: [buildField('id')] })];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id'],
			});
		});

		test('should filter out __ fields (graphql pointers)', async () => {
			const selections = [
				buildField('__typename', { children: [] }),
				buildField('count', { children: [buildField('id')] }),
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id'],
			});

			expect(result.aggregate).not.toHaveProperty('__typename');
		});

		test('should group like field node selections into aggregate properties', async () => {
			const selections = [buildField('count', { children: [buildField('id'), buildField('name')] })];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id', 'name'],
			});
		});

		test('should handle multiple aggregation groups', async () => {
			const selections = [
				buildField('count', { children: [buildField('id')] }),
				buildField('sum', { children: [buildField('price')] }),
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id'],
				sum: ['price'],
			});
		});

		test('should filter out __ field selections', async () => {
			const selections = [
				buildField('count', {
					children: [buildField('__typename'), buildField('id'), buildField('__schema'), buildField('name')],
				}),
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id', 'name'],
			});
		});

		test('should handle field nodes without a selectionSet', async () => {
			const selections = [buildField('count')];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: [],
			});
		});

		test('should skip the group field selection', async () => {
			const selections = [buildField('count', { children: [buildField('id')] }), buildField('group')];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id'],
			});

			expect(result.aggregate).not.toHaveProperty('group');
		});

		test('should handle field nodes with an empty selectionSet', async () => {
			const selections = [buildField('count', { children: [] })];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: [],
			});
		});

		test('should combine repeated aggregation groups', async () => {
			const selections = [
				buildField('count', { children: [buildField('id')] }),
				buildField('count', { children: [buildField('name')] }),
			];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				count: ['id', 'name'],
			});
		});

		test('should not read an aggregation group off the object prototype', async () => {
			const selections = [buildField('toString', { children: [buildField('id')] })];

			const result = await getAggregateQuery({}, selections, schema);

			expect(result.aggregate).toEqual({
				toString: ['id'],
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

/**
 * A fragment is a way of writing a selection, not a thing the query knows about, so these cover what
 * getAggregateQuery makes of the selections a resolver hands it once the fragments are resolved
 */
describe('getAggregateQuery with resolved fragments', () => {
	// The GraphQL schema get-types.ts generates for an aggregated collection
	const gqlSchema = buildSchema(`
		type article_aggregated_count { id: Int }
		type article_aggregated { group: String, count: article_aggregated_count }
		type Query { article_aggregated: [article_aggregated] }
	`);

	/** The selections a resolver hands to getAggregateQuery, fragments resolved */
	const resolvedSelections = (fragments: Record<string, FragmentDefinitionNode>) =>
		buildSelections(
			buildResolveInfo({
				selections: [buildFragmentSpread('Totals')],
				fragments,
				schema: gqlSchema,
				returnType: gqlSchema.getQueryType()!.getFields()['article_aggregated']!.type,
			}),
		) ?? [];

	test('fragment on an aggregation keeps the aggregate', async () => {
		const selections = resolvedSelections({
			Totals: buildFragmentDefinition('Totals', 'article_aggregated', [
				buildField('count', { children: [buildField('id')] }),
			]),
		});

		const result = await getAggregateQuery({}, selections, schema);

		expect(result.aggregate).toEqual({ count: ['id'] });
	});

	// Guards #26626: `group` holds grouped values and is not an aggregate function
	test('fragment on an aggregation does not treat group as an aggregate', async () => {
		const selections = resolvedSelections({
			Totals: buildFragmentDefinition('Totals', 'article_aggregated', [
				buildField('group'),
				buildField('count', { children: [buildField('id')] }),
			]),
		});

		const result = await getAggregateQuery({}, selections, schema);

		expect(result.aggregate).toEqual({ count: ['id'] });
	});
});

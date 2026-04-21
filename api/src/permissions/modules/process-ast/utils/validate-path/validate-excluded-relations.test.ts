import { ForbiddenError } from '@directus/errors';
import type { Relation, RelationMeta, SchemaOverview } from '@directus/types';
import { describe, expect, test, vi } from 'vitest';
import { getExcludedCollections } from '../../../../../utils/get-excluded-collections.js';
import type { FieldMap } from '../../types.js';
import { validateExcludedRelations } from './validate-excluded-relations.js';

vi.mock('../../../../../utils/get-excluded-collections.js', () => ({
	getExcludedCollections: vi.fn(),
}));

type DirectusCollectionsRow = { collection: string };

type RelationMetaRow = {
	many_collection: string;
	many_field: string;
	one_collection: string | null;
	one_field: string | null;
	one_allowed_collections: unknown;
};

type KnexLike = {
	select: (column: 'collection') => {
		from: (table: 'directus_collections') => {
			where: (column: 'excluded', value: boolean) => Promise<DirectusCollectionsRow[]>;
		};
	};
	(table: 'directus_relations'): {
		select: (
			...columns: ['many_collection', 'many_field', 'one_collection', 'one_field', 'one_allowed_collections']
		) => {
			where: (
				callback: (queryBuilder: {
					orWhere: (callback: (inner: { where: (obj: unknown) => void }) => void) => void;
				}) => void,
			) => Promise<RelationMetaRow[]>;
		};
	};
};

function createKnexMock(options: { excludedCollections: string[]; relationRows?: RelationMetaRow[] }): KnexLike {
	const relationRows = options.relationRows ?? [];

	return Object.assign(
		(_table: 'directus_relations') => ({
			select: () => ({
				where: async () => relationRows,
			}),
		}),
		{
			select: () => ({
				from: () => ({
					where: async () => options.excludedCollections.map((collection) => ({ collection })),
				}),
			}),
		},
	);
}

function createSchemaOverview(options: {
	collection: string;
	field: string;
	special: string[];
	relations: Relation[];
}): SchemaOverview {
	return {
		collections: {
			[options.collection]: {
				collection: options.collection,
				primary: 'id',
				singleton: false,
				accountability: null,
				note: null,
				sortField: null,
				fields: {
					id: {
						field: 'id',
						type: 'integer',
						dbType: null,
						defaultValue: null,
						nullable: false,
						generated: false,
						alias: false,
						searchable: true,
						note: null,
						precision: null,
						scale: null,
						special: [],
						validation: null,
					},
					[options.field]: {
						field: options.field,
						type: 'alias',
						dbType: null,
						defaultValue: null,
						nullable: true,
						generated: false,
						alias: true,
						searchable: true,
						note: null,
						precision: null,
						scale: null,
						special: options.special,
						validation: null,
					},
				},
			},
		},
		relations: options.relations,
	} as unknown as SchemaOverview;
}

function createFieldMap(collection: string, fields: string[]): FieldMap {
	return {
		read: new Map(),
		other: new Map([['', { collection, fields: new Set(fields) }]]),
	};
}

function createTraversedFieldMap(
	rootCollection: string,
	rootField: string,
	nestedCollection: string,
	nestedField: string,
): FieldMap {
	return {
		read: new Map([
			[
				rootField,
				{
					collection: nestedCollection,
					fields: new Set([nestedField]),
				},
			],
		]),
		other: new Map([['', { collection: rootCollection, fields: new Set([rootField]) }]]),
	};
}

describe('validateExcludedRelations', () => {
	test('does nothing when no collections are excluded', async () => {
		vi.mocked(getExcludedCollections).mockResolvedValueOnce(new Set());

		const schema = createSchemaOverview({
			collection: 'cities',
			field: 'country',
			special: ['m2o'],
			relations: [
				{
					collection: 'cities',
					field: 'country',
					related_collection: 'countries',
					schema: null,
					meta: null,
				},
			],
		});

		const knex = createKnexMock({ excludedCollections: [] });
		const fieldMap = createFieldMap('cities', ['country']);

		await expect(
			validateExcludedRelations(fieldMap, schema, knex as unknown as Parameters<typeof validateExcludedRelations>[2]),
		).resolves.toBeUndefined();
	});

	test('throws ForbiddenError when stitched relation points to excluded collection (m2o)', async () => {
		vi.mocked(getExcludedCollections).mockResolvedValueOnce(new Set(['countries']));

		const schema = createSchemaOverview({
			collection: 'cities',
			field: 'country',
			special: ['m2o'],
			relations: [
				{
					collection: 'cities',
					field: 'country',
					related_collection: 'countries',
					schema: null,
					meta: null,
				},
			],
		});

		const knex = createKnexMock({ excludedCollections: ['countries'] });
		const fieldMap = createTraversedFieldMap('cities', 'country', 'countries', 'name');

		await expect(
			validateExcludedRelations(fieldMap, schema, knex as unknown as Parameters<typeof validateExcludedRelations>[2]),
		).rejects.toThrowError(ForbiddenError);
	});

	test('allows scalar relational fields when the related collection is excluded', async () => {
		vi.mocked(getExcludedCollections).mockResolvedValueOnce(new Set(['countries']));

		const schema = createSchemaOverview({
			collection: 'cities',
			field: 'country',
			special: ['m2o'],
			relations: [
				{
					collection: 'cities',
					field: 'country',
					related_collection: 'countries',
					schema: null,
					meta: null,
				},
			],
		});

		const knex = createKnexMock({ excludedCollections: ['countries'] });
		const fieldMap = createFieldMap('cities', ['country']);

		await expect(
			validateExcludedRelations(fieldMap, schema, knex as unknown as Parameters<typeof validateExcludedRelations>[2]),
		).resolves.toBeUndefined();
	});

	test('throws ForbiddenError when m2a allowed targets include an excluded collection', async () => {
		vi.mocked(getExcludedCollections).mockResolvedValueOnce(new Set(['secret']));

		const schema = createSchemaOverview({
			collection: 'feed',
			field: 'items',
			special: ['m2a'],
			relations: [
				{
					collection: 'feed',
					field: 'items',
					related_collection: null,
					schema: null,
					meta: {
						id: 1,
						many_collection: 'feed',
						many_field: 'items',
						one_collection: null,
						one_field: null,
						one_collection_field: null,
						one_allowed_collections: ['articles', 'secret'],
						one_deselect_action: 'nullify',
						junction_field: null,
						sort_field: null,
						system: false,
					} satisfies RelationMeta,
				},
			],
		});

		const knex = createKnexMock({ excludedCollections: ['secret'] });
		const fieldMap = createFieldMap('feed', ['items']);

		await expect(
			validateExcludedRelations(fieldMap, schema, knex as unknown as Parameters<typeof validateExcludedRelations>[2]),
		).rejects.toThrowError(ForbiddenError);
	});
});

import type { Relation, SchemaOverview } from '@directus/types';
import { describe, expect, test, vi } from 'vitest';
import { buildPayload, mergeNestedRelationDeltaInto, REFUSAL, resolveWriteTarget } from './write-target.js';

describe('resolveWriteTarget', () => {
	test('routes versioned collection updates to the item version', async () => {
		const result = await resolveWriteTarget({
			schema: createSchema(),
			target: { collection: 'pages', key: 1 },
			hint: { explicitVersion: 'draft' },
			collectionHasVersioning: versionedCollections('pages'),
			readParent: vi.fn(),
		});

		expect(result).toEqual({ kind: 'item-version', collection: 'pages', key: 1, versionKey: 'draft' });
	});

	test('refuses versioned collection updates without a draft version', async () => {
		for (const explicitVersion of [undefined, 'published', 'main']) {
			const result = await resolveWriteTarget({
				schema: createSchema(),
				target: { collection: 'pages', key: 1 },
				hint: { explicitVersion },
				collectionHasVersioning: versionedCollections('pages'),
				readParent: vi.fn(),
			});

			expect(result).toMatchObject({ kind: 'refuse', token: REFUSAL.VERSIONING_REQUIRED });
		}
	});

	test('routes O2M child updates through the parent version', async () => {
		const schema = createSchema([
			relation('articles_translations', 'articles_id', 'articles', {
				oneField: 'translations',
			}),
		]);

		const result = await resolveWriteTarget({
			schema,
			target: { collection: 'articles_translations', key: 5 },
			hint: { page: { collection: 'articles', item: 1, version: 'draft' } },
			collectionHasVersioning: versionedCollections('articles'),
			readParent: vi.fn(async () => ({ translations: [{ id: 5, title: 'Old' }] })),
		});

		expect(result.kind).toBe('parent-version');
		expect(buildPayload(result as any, { title: 'New' }, 5)).toEqual({
			translations: {
				create: [],
				update: [{ id: 5, title: 'New' }],
				delete: [],
			},
		});
	});

	test('routes M2M related item updates through the parent version', async () => {
		const schema = createSchema([
			relation('articles_tags', 'articles_id', 'articles', {
				oneField: 'tags',
				junctionField: 'tags_id',
			}),
			relation('articles_tags', 'tags_id', 'tags'),
		]);

		const result = await resolveWriteTarget({
			schema,
			target: { collection: 'tags', key: 5 },
			hint: { page: { collection: 'articles', item: 1, version: 'draft' } },
			collectionHasVersioning: versionedCollections('articles'),
			readParent: vi.fn(async () => ({ tags: [{ id: 12, tags_id: { id: 5, name: 'Old' } }] })),
		});

		expect(result.kind).toBe('parent-version');
		expect(buildPayload(result as any, { name: 'New' }, 5)).toEqual({
			tags: {
				create: [],
				update: [{ id: 12, tags_id: { id: 5, name: 'New' } }],
				delete: [],
			},
		});
	});

	test('routes M2A child updates through the parent version', async () => {
		const schema = createSchema([
			relation('pages_blocks', 'pages_id', 'pages', {
				oneField: 'blocks',
				junctionField: 'item',
			}),
			relation('pages_blocks', 'item', null, {
				oneCollectionField: 'collection',
				oneAllowedCollections: ['block_hero'],
			}),
		]);

		const result = await resolveWriteTarget({
			schema,
			target: { collection: 'block_hero', key: 9 },
			hint: { page: { collection: 'pages', item: 1, version: 'draft' } },
			collectionHasVersioning: versionedCollections('pages'),
			readParent: vi.fn(async () => ({ blocks: [{ id: 7, collection: 'block_hero', item: { id: 9, title: 'Old' } }] })),
		});

		expect(result.kind).toBe('parent-version');
		expect(buildPayload(result as any, { title: 'New' }, 9)).toEqual({
			blocks: {
				create: [],
				update: [{ id: 7, collection: 'block_hero', item: { id: 9, title: 'New' } }],
				delete: [],
			},
		});
	});

	test('routes M2O child updates through the parent version', async () => {
		const schema = createSchema([relation('pages', 'seo', 'seo')]);

		const result = await resolveWriteTarget({
			schema,
			target: { collection: 'seo', key: 4 },
			hint: { page: { collection: 'pages', item: 1, version: 'draft' } },
			collectionHasVersioning: versionedCollections('pages'),
			readParent: vi.fn(async () => ({ seo: { id: 4, title: 'Old' } })),
		});

		expect(result.kind).toBe('parent-version');
		expect(buildPayload(result as any, { title: 'New' }, 4)).toEqual({
			seo: { id: 4, title: 'New' },
		});
	});

	test('disambiguates multiple structural relations after reading the parent', async () => {
		const schema = createSchema([
			relation('pages_blocks', 'pages_id', 'pages', {
				oneField: 'hero_blocks',
				junctionField: 'item',
			}),
			relation('pages_blocks', 'item', null, {
				oneCollectionField: 'collection',
				oneAllowedCollections: ['block_hero'],
			}),
			relation('pages_other_blocks', 'pages_id', 'pages', {
				oneField: 'other_blocks',
				junctionField: 'item',
			}),
			relation('pages_other_blocks', 'item', null, {
				oneCollectionField: 'collection',
				oneAllowedCollections: ['block_hero'],
			}),
		]);

		const result = await resolveWriteTarget({
			schema,
			target: { collection: 'block_hero', key: 9 },
			hint: { page: { collection: 'pages', item: 1, version: 'draft' } },
			collectionHasVersioning: versionedCollections('pages'),
			readParent: vi.fn(async () => ({
				hero_blocks: [{ id: 7, collection: 'block_hero', item: { id: 9 } }],
				other_blocks: [{ id: 8, collection: 'block_hero', item: { id: 10 } }],
			})),
		});

		expect(result).toMatchObject({ kind: 'parent-version', relation: { kind: 'm2a', parentField: 'hero_blocks' } });
	});

	test('refuses only when multiple relations actually contain the target', async () => {
		const schema = createSchema([
			relation('pages_blocks', 'pages_id', 'pages', {
				oneField: 'blocks',
				junctionField: 'item',
			}),
			relation('pages_blocks', 'item', null, {
				oneCollectionField: 'collection',
				oneAllowedCollections: ['block_hero'],
			}),
			relation('pages_other_blocks', 'pages_id', 'pages', {
				oneField: 'other_blocks',
				junctionField: 'item',
			}),
			relation('pages_other_blocks', 'item', null, {
				oneCollectionField: 'collection',
				oneAllowedCollections: ['block_hero'],
			}),
		]);

		const result = await resolveWriteTarget({
			schema,
			target: { collection: 'block_hero', key: 9 },
			hint: { page: { collection: 'pages', item: 1, version: 'draft' } },
			collectionHasVersioning: versionedCollections('pages'),
			readParent: vi.fn(async () => ({
				blocks: [{ id: 7, collection: 'block_hero', item: { id: 9 } }],
				other_blocks: [{ id: 8, collection: 'block_hero', item: { id: 9 } }],
			})),
		});

		expect(result).toMatchObject({ kind: 'refuse', token: REFUSAL.MULTI_RELATION });
	});

	test('refuses versioned child saves without parent context', async () => {
		const result = await resolveWriteTarget({
			schema: createSchema(),
			target: { collection: 'blocks', key: 1 },
			hint: { explicitVersion: 'draft' },
			collectionHasVersioning: versionedCollections(),
			readParent: vi.fn(),
		});

		expect(result).toMatchObject({ kind: 'refuse', token: REFUSAL.NO_PARENT_CONTEXT });
	});
});

describe('mergeNestedRelationDeltaInto', () => {
	test('deep-merges detailed update syntax for different rows and overwrites other fields', () => {
		const target = {
			blocks: { create: [{ id: 1 }], update: [{ id: 2 }], delete: [3] },
			seo: { id: 1, title: 'Old' },
		};

		mergeNestedRelationDeltaInto(target, {
			blocks: { create: [{ id: 4 }], update: [{ id: 5 }], delete: [6] },
			seo: { id: 1, description: 'New' },
		});

		expect(target).toEqual({
			blocks: {
				create: [{ id: 1 }, { id: 4 }],
				update: [{ id: 2 }, { id: 5 }],
				delete: [3, 6],
			},
			seo: { id: 1, description: 'New' },
		});
	});

	test('merges repeated detailed updates for the same row', () => {
		const target = {
			blocks: {
				create: [],
				update: [
					{
						id: 'junction-1',
						collection: 'block_hero',
						item: { id: 'block-1', headline: 'Old', tagline: 'Backend + CMS test' },
					},
				],
				delete: [],
			},
		};

		mergeNestedRelationDeltaInto(target, {
			blocks: {
				create: [],
				update: [
					{
						id: 'junction-1',
						collection: 'block_hero',
						item: { id: 'block-1', tagline: 'Backend + CMS carlos' },
					},
				],
				delete: [],
			},
		});

		expect(target.blocks.update).toEqual([
			{
				id: 'junction-1',
				collection: 'block_hero',
				item: { id: 'block-1', headline: 'Old', tagline: 'Backend + CMS carlos' },
			},
		]);
	});
});

function createSchema(relations: Relation[] = []): SchemaOverview {
	const collectionNames = [
		'articles',
		'articles_tags',
		'articles_translations',
		'block_hero',
		'blocks',
		'pages',
		'pages_blocks',
		'pages_other_blocks',
		'seo',
		'tags',
	];

	return {
		collections: Object.fromEntries(
			collectionNames.map((collection) => [collection, { collection, primary: 'id', singleton: false, fields: {} }]),
		),
		relations,
	} as unknown as SchemaOverview;
}

function relation(
	collection: string,
	field: string,
	relatedCollection: string | null,
	options: {
		oneField?: string | null;
		junctionField?: string | null;
		oneCollectionField?: string | null;
		oneAllowedCollections?: string[] | null;
	} = {},
): Relation {
	return {
		collection,
		field,
		related_collection: relatedCollection,
		schema: null,
		meta: {
			id: 1,
			many_collection: collection,
			many_field: field,
			one_collection: relatedCollection,
			one_field: options.oneField ?? null,
			one_collection_field: options.oneCollectionField ?? null,
			one_allowed_collections: options.oneAllowedCollections ?? null,
			one_deselect_action: 'nullify',
			junction_field: options.junctionField ?? null,
			sort_field: null,
		},
	};
}

function versionedCollections(...collections: string[]) {
	const versioned = new Set(collections);
	return (collection: string) => versioned.has(collection);
}

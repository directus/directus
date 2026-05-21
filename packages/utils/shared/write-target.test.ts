import type { Relation, SchemaOverview } from '@directus/types';
import { describe, expect, test, vi } from 'vitest';
import {
	buildPayload,
	findParentInitialValue,
	getParentInitialValueFields,
	getSchemaPrimaryKeyFields,
	mergeNestedRelationDeltaInto,
	resolveWriteTarget,
	WRITE_TARGET_REFUSAL,
	type WriteTarget,
} from './write-target.js';

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

			expect(result).toMatchObject({ kind: 'refuse', token: WRITE_TARGET_REFUSAL.VERSIONING_REQUIRED });
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

		expect(buildPayload(result as WriteTarget, { title: 'New' }, 5)).toEqual({
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

		expect(buildPayload(result as WriteTarget, { name: 'New' }, 5)).toEqual({
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

		expect(buildPayload(result as WriteTarget, { title: 'New' }, 9)).toEqual({
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

		expect(buildPayload(result as WriteTarget, { title: 'New' }, 4)).toEqual({
			seo: { id: 4, title: 'New' },
		});
	});

	test('routes M2O child updates through the parent version when a reverse alias exists', async () => {
		const schema = createSchema([relation('pages', 'seo', 'seo', { oneField: 'pages' })]);

		const result = await resolveWriteTarget({
			schema,
			target: { collection: 'seo', key: 4 },
			hint: { page: { collection: 'pages', item: 1, version: 'draft' } },
			collectionHasVersioning: versionedCollections('pages'),
			readParent: vi.fn(async () => ({ seo: { id: 4, title: 'Old' } })),
		});

		expect(result.kind).toBe('parent-version');

		expect(buildPayload(result as WriteTarget, { title: 'New' }, 4)).toEqual({
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

		expect(result).toMatchObject({ kind: 'refuse', token: WRITE_TARGET_REFUSAL.MULTI_RELATION });
	});

	test('refuses versioned child saves without parent context', async () => {
		const result = await resolveWriteTarget({
			schema: createSchema(),
			target: { collection: 'blocks', key: 1 },
			hint: { explicitVersion: 'draft' },
			collectionHasVersioning: versionedCollections(),
			readParent: vi.fn(),
		});

		expect(result).toMatchObject({ kind: 'refuse', token: WRITE_TARGET_REFUSAL.NO_PARENT_CONTEXT });
	});

	test('routes to published when the parent collection is not versioned', async () => {
		const readParent = vi.fn();

		const result = await resolveWriteTarget({
			schema: createSchema([relation('pages', 'seo', 'seo')]),
			target: { collection: 'seo', key: 4 },
			hint: { page: { collection: 'pages', item: 1, version: 'draft' } },
			collectionHasVersioning: versionedCollections(),
			readParent,
		});

		expect(result).toEqual({ kind: 'published', collection: 'seo', key: 4 });
		expect(readParent).not.toHaveBeenCalled();
	});

	test('refuses parent version saves when the target item is not in the parent version', async () => {
		const result = await resolveWriteTarget({
			schema: createSchema([relation('pages', 'seo', 'seo')]),
			target: { collection: 'seo', key: 4 },
			hint: { page: { collection: 'pages', item: 1, version: 'draft' } },
			collectionHasVersioning: versionedCollections('pages'),
			readParent: vi.fn(async () => ({ seo: { id: 5 } })),
		});

		expect(result).toMatchObject({ kind: 'refuse', token: WRITE_TARGET_REFUSAL.RELATED_NOT_FOUND });
	});

	test('refuses stale visual attachments when the target item is not in the parent version', async () => {
		const result = await resolveWriteTarget({
			schema: createSchema([relation('pages', 'seo', 'seo')]),
			target: { collection: 'seo', key: 4 },
			hint: {
				attachment: {
					collection: 'seo',
					item: 4,
					version: 'draft',
					parent: { collection: 'pages', key: 1, versionKey: 'draft' },
				},
			},
			collectionHasVersioning: versionedCollections('pages'),
			readParent: vi.fn(async () => ({ seo: { id: 5 } })),
		});

		expect(result).toMatchObject({ kind: 'refuse', token: WRITE_TARGET_REFUSAL.STALE_ATTACHMENT });
	});

	test('returns the parent item from the winning candidate, not a later non-match', async () => {
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

		const winningParent = { blocks: [{ id: 7, collection: 'block_hero', item: { id: 9 } }], _marker: 'winner' };

		const nonMatchingParent = {
			other_blocks: [{ id: 8, collection: 'block_hero', item: { id: 10 } }],
			_marker: 'loser',
		};

		const readParent = vi.fn().mockResolvedValueOnce(winningParent).mockResolvedValueOnce(nonMatchingParent);

		const result = await resolveWriteTarget({
			schema,
			target: { collection: 'block_hero', key: 9 },
			hint: { page: { collection: 'pages', item: 1, version: 'draft' } },
			collectionHasVersioning: versionedCollections('pages'),
			readParent,
		});

		expect(result).toMatchObject({ kind: 'parent-version', parentItem: { _marker: 'winner' } });
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

	test('merges repeated detailed updates with custom primary key fields', () => {
		const target = {
			blocks: {
				create: [],
				update: [{ junction_uuid: 'junction-1', title: 'Old' }],
				delete: [],
			},
		};

		mergeNestedRelationDeltaInto(
			target,
			{
				blocks: {
					create: [],
					update: [{ junction_uuid: 'junction-1', title: 'New' }],
					delete: [],
				},
			},
			{ identityFields: ['junction_uuid'] },
		);

		expect(target.blocks.update).toEqual([{ junction_uuid: 'junction-1', title: 'New' }]);
	});

	test('preserves nested custom primary key fields when merging repeated updates', () => {
		const target = {
			blocks: {
				create: [],
				update: [
					{
						junction_uuid: 'junction-1',
						collection: 'block_hero',
						item: { block_uuid: 'block-1', headline: 'Old', tagline: 'Old tagline' },
					},
				],
				delete: [],
			},
		};

		mergeNestedRelationDeltaInto(
			target,
			{
				blocks: {
					create: [],
					update: [
						{
							junction_uuid: 'junction-1',
							collection: 'block_hero',
							item: { block_uuid: 'block-1', tagline: 'New tagline' },
						},
					],
					delete: [],
				},
			},
			{ identityFields: ['junction_uuid', 'block_uuid'] },
		);

		expect(target.blocks.update).toEqual([
			{
				junction_uuid: 'junction-1',
				collection: 'block_hero',
				item: { block_uuid: 'block-1', headline: 'Old', tagline: 'New tagline' },
			},
		]);
	});

	test('derives primary key fields from the schema', () => {
		const schema = createSchema();
		schema.collections['pages']!.primary = 'page_uuid';
		schema.collections['block_hero']!.primary = 'block_uuid';

		expect(getSchemaPrimaryKeyFields(schema)).toEqual(['block_uuid', 'page_uuid', 'id']);
	});
});

describe('getParentInitialValueFields', () => {
	test('uses `.*` projection for o2m and m2m so the form has data to render', () => {
		// Locks the intentional divergence from the internal `getParentReadFields` — read-time
		// only needs the child pk to verify the match, but the initial-value preview needs the
		// full child shape. A future "harmonization" pass that collapses the two would silently
		// break the form preview for o2m and m2m children.
		expect(getParentInitialValueFields({ kind: 'o2m', parentField: 'translations', childPkField: 'id' })).toEqual([
			'translations.*',
		]);

		expect(
			getParentInitialValueFields({
				kind: 'm2m',
				parentField: 'tags',
				junctionCollection: 'articles_tags',
				junctionPkField: 'id',
				junctionField: 'tags_id',
				junctionItem: {},
				childPkField: 'id',
			}),
		).toEqual(['tags.id', 'tags.tags_id.*']);
	});

	test('returns full field paths for m2o and m2a', () => {
		expect(getParentInitialValueFields({ kind: 'm2o', parentField: 'seo', childPkField: 'id' })).toEqual(['seo.*']);

		expect(
			getParentInitialValueFields({
				kind: 'm2a',
				parentField: 'blocks',
				junctionCollection: 'pages_blocks',
				junctionPkField: 'id',
				junctionField: 'item',
				collectionField: 'collection',
				junctionItem: {},
				childPkField: 'id',
			}),
		).toEqual(['blocks.id', 'blocks.collection', 'blocks.item.*']);
	});
});

describe('findParentInitialValue', () => {
	test('returns the matching child for m2o', () => {
		const child = findParentInitialValue(
			{ kind: 'm2o', parentField: 'seo', childPkField: 'id' },
			{ seo: { id: 4, title: 'Hello' } },
			'seo',
			4,
		);

		expect(child).toEqual({ id: 4, title: 'Hello' });
	});

	test('returns null when the m2o child key does not match', () => {
		const child = findParentInitialValue(
			{ kind: 'm2o', parentField: 'seo', childPkField: 'id' },
			{ seo: { id: 4 } },
			'seo',
			99,
		);

		expect(child).toBeNull();
	});

	test('returns the matching child for o2m', () => {
		const child = findParentInitialValue(
			{ kind: 'o2m', parentField: 'translations', childPkField: 'id' },
			{
				translations: [
					{ id: 5, title: 'Old' },
					{ id: 6, title: 'Other' },
				],
			},
			'articles_translations',
			5,
		);

		expect(child).toEqual({ id: 5, title: 'Old' });
	});

	test('returns the matching child for m2m', () => {
		const child = findParentInitialValue(
			{
				kind: 'm2m',
				parentField: 'tags',
				junctionCollection: 'articles_tags',
				junctionPkField: 'id',
				junctionField: 'tags_id',
				junctionItem: {},
				childPkField: 'id',
			},
			{ tags: [{ id: 12, tags_id: { id: 5, name: 'Featured' } }] },
			'tags',
			5,
		);

		expect(child).toEqual({ id: 5, name: 'Featured' });
	});

	test('returns the matching child for m2a and rejects mismatching collection', () => {
		const relation = {
			kind: 'm2a' as const,
			parentField: 'blocks',
			junctionCollection: 'pages_blocks',
			junctionPkField: 'id',
			junctionField: 'item',
			collectionField: 'collection',
			junctionItem: {},
			childPkField: 'id',
		};

		expect(
			findParentInitialValue(
				relation,
				{ blocks: [{ id: 7, collection: 'block_hero', item: { id: 9, headline: 'Hi' } }] },
				'block_hero',
				9,
			),
		).toEqual({ id: 9, headline: 'Hi' });

		expect(
			findParentInitialValue(
				relation,
				{ blocks: [{ id: 7, collection: 'block_cta', item: { id: 9, headline: 'Hi' } }] },
				'block_hero',
				9,
			),
		).toBeNull();
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

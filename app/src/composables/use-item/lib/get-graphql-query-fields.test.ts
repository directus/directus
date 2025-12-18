import { mockedStore } from '@/__utils__/store.js';
import { useFieldsStore } from '@/stores/fields.js';
import { useRelationsStore } from '@/stores/relations.js';
import { getRelatedCollection } from '@/utils/get-related-collection.js';
import { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGraphqlQueryFields } from './get-graphql-query-fields.js';
import { transformM2AAliases } from './transform-m2a-aliases.js';

vi.mock('@/utils/get-related-collection.js');

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

it('should return all direct fields for collection if field input is empty', () => {
	const fieldsStore = mockedStore(useFieldsStore());

	fieldsStore.getFieldsForCollection.mockReturnValue([
		{ field: 'title' },
		{ field: 'divider', meta: { special: ['no-data'] } },
	] as Field[]);

	const fields: string[] = [];
	const collection = 'articles';

	const result = getGraphqlQueryFields(fields, collection);

	expect(result.queryFields).toEqual({ title: true });
	expect(result.m2aAliasMap).toEqual({});
});

it('should return non-related fields directly', () => {
	vi.mocked(getRelatedCollection).mockImplementation((collection, field) => {
		if (collection === 'articles' && field === 'author')
			return {
				relatedCollection: 'authors',
			};

		return null;
	});

	const fields: string[] = ['title', 'author.first_name', 'author.last_name'];
	const collection = 'articles';

	const result = getGraphqlQueryFields(fields, collection);

	expect(result.queryFields).toEqual({ title: true, author: { first_name: true, last_name: true } });
	expect(result.m2aAliasMap).toEqual({});
});

it('should include primary keys for relational fields', () => {
	vi.mocked(getRelatedCollection).mockImplementation((collection, field) => {
		if (collection === 'articles' && field === 'author')
			return {
				relatedCollection: 'authors',
			};

		if (collection === 'authors' && field === 'avatar')
			return {
				relatedCollection: 'directus_files',
			};

		if (collection === 'articles' && field === 'translations')
			return {
				relatedCollection: 'translations',
				junctionCollection: 'articles_translations',
			};

		return null;
	});

	const fieldsStore = mockedStore(useFieldsStore());

	fieldsStore.getPrimaryKeyFieldForCollection.mockImplementation((collection) => {
		switch (collection) {
			case 'directus_files':
			case 'articles_translations':
				return { field: 'id' } as Field;
			default:
				return null;
		}
	});

	const fields: string[] = ['author.avatar', 'translations'];
	const collection = 'articles';

	const result = getGraphqlQueryFields(fields, collection);

	expect(result.queryFields).toEqual({ author: { avatar: { id: true } }, translations: { id: true } });
	expect(result.m2aAliasMap).toEqual({});
});

it('should work with m2a fields and use aliases for nested fields', () => {
	vi.mocked(getRelatedCollection).mockImplementation((collection, field) => {
		if (collection === 'pages')
			switch (field) {
				case 'blocks':
					return {
						relatedCollection: 'pages_blocks',
					};
				case 'sub_blocks':
					return {
						relatedCollection: 'pages_sub_blocks',
					};
			}

		return null;
	});

	const fieldsStore = mockedStore(useFieldsStore());

	fieldsStore.getPrimaryKeyFieldForCollection.mockImplementation((collection) => {
		switch (collection) {
			case 'block_text':
			case 'pages_blocks':
			case 'pages_sub_blocks':
				return { field: 'id' } as Field;
			default:
				return null;
		}
	});

	const relationsStore = mockedStore(useRelationsStore());

	relationsStore.getRelationForField.mockImplementation((currentCollection, sourceField) => {
		if (
			(currentCollection === 'pages_blocks' && sourceField === 'item') ||
			(currentCollection === 'pages_sub_blocks' && sourceField === 'different_field_for_test')
		)
			return {
				meta: { one_collection_field: 'collection' },
			} as Relation;

		return null;
	});

	const fields: string[] = [
		'blocks.item:block_text',
		'sub_blocks.different_field_for_test:block_paragraph.id',
		'sub_blocks.different_field_for_test:block_paragraph.text',
	];

	const collection = 'pages';

	const result = getGraphqlQueryFields(fields, collection);

	expect(result.queryFields).toEqual({
		blocks: {
			__args: {
				filter: {
					collection: {
						_in: ['block_text'],
					},
				},
			},
			id: true,
			item: {
				__on: [
					{
						__typeName: 'block_text',
						id: true,
					},
				],
			},
		},
		sub_blocks: {
			__args: {
				filter: {
					collection: {
						_in: ['block_paragraph'],
					},
				},
			},
			different_field_for_test: {
				__on: [
					{
						__typeName: 'block_paragraph',
						block_paragraph__id: { __aliasFor: 'id' },
						block_paragraph__text: { __aliasFor: 'text' },
					},
				],
			},
			id: true,
		},
	});

	expect(result.m2aAliasMap).toEqual({
		'sub_blocks.different_field_for_test': {
			collectionField: 'collection',
			junctionField: 'different_field_for_test',
			aliases: {
				block_paragraph: {
					block_paragraph__id: 'id',
					block_paragraph__text: 'text',
				},
			},
		},
	});
});

/**
 * Tests for GitHub Issue #25476
 * @see https://github.com/directus/directus/issues/25476
 *
 * Problem: Duplicating items with M2A fields that link to collections with conflicting field types
 * causes a GraphQL validation error.
 *
 * Scenario from the issue:
 * - child1 collection has a JSON field called 'items'
 * - child2 collection has a 1:N relation field also called 'items'
 * - parent collection has M2A field 'children' linking to both child1 and child2
 *
 * Without aliases, the generated GraphQL query would be:
 *   ... on child1 { items }      <- JSON type
 *   ... on child2 { items { id } } <- [child2_items] type
 *
 * This causes GraphQL validation error:
 *   "Fields 'items' conflict because they return conflicting types '[child2_items]' and 'JSON'"
 *
 * Solution: Use field aliases prefixed with collection name in inline fragments:
 *   ... on child1 { child1__items: items }
 *   ... on child2 { child2__items: items { id } }
 */
describe('m2a fields with conflicting field types (issue #25476)', () => {
	function setupMocksForIssue25476() {
		vi.mocked(getRelatedCollection).mockImplementation((collection, field) => {
			if (collection === 'parent' && field === 'children') {
				return { relatedCollection: 'parent_children' };
			}

			if (collection === 'child1' && field === 'items') {
				return null; // JSON field - not a relation
			}

			if (collection === 'child2' && field === 'items') {
				return { relatedCollection: 'child2_items' }; // 1:N relation
			}

			return null;
		});

		const fieldsStore = mockedStore(useFieldsStore());

		fieldsStore.getPrimaryKeyFieldForCollection.mockImplementation((collection) => {
			switch (collection) {
				case 'parent_children':
				case 'child1':
				case 'child2':
				case 'child2_items':
					return { field: 'id' } as Field;
				default:
					return null;
			}
		});

		const relationsStore = mockedStore(useRelationsStore());

		relationsStore.getRelationForField.mockImplementation((currentCollection, sourceField) => {
			if (currentCollection === 'parent_children' && sourceField === 'item') {
				return {
					meta: { one_collection_field: 'collection' },
				} as Relation;
			}

			return null;
		});
	}

	it('should use aliases to avoid GraphQL validation errors when collections have same field names', () => {
		setupMocksForIssue25476();

		// These are the duplication fields from the issue:
		// ["children.collection", "children.item:child2.items", "children.item:child1.items"]
		const fields: string[] = [
			'children.collection',
			'children.item:child1.items', // JSON field
			'children.item:child2.items', // 1:N relation field
		];

		const collection = 'parent';

		const result = getGraphqlQueryFields(fields, collection);

		// Both 'items' fields should be aliased with their collection prefix
		expect(result.queryFields.children.item.__on).toEqual([
			{
				__typeName: 'child1',
				child1__items: { __aliasFor: 'items' }, // JSON field aliased
			},
			{
				__typeName: 'child2',
				child2__items: { __aliasFor: 'items', id: true }, // Relation field aliased
			},
		]);

		expect(result.m2aAliasMap).toEqual({
			'children.item': {
				collectionField: 'collection',
				junctionField: 'item',
				aliases: {
					child1: { child1__items: 'items' },
					child2: { child2__items: 'items' },
				},
			},
		});
	});

	it('should generate valid GraphQL query with aliased fields that avoids type conflicts', () => {
		setupMocksForIssue25476();

		const fields: string[] = ['children.collection', 'children.item:child1.items', 'children.item:child2.items'];

		const { queryFields } = getGraphqlQueryFields(fields, 'parent');

		// Generate the actual GraphQL query string
		const graphqlQuery = jsonToGraphQLQuery({
			query: {
				parent_by_id: {
					__args: { id: '123' },
					...queryFields,
				},
			},
		});

		// The query should use aliases to avoid field conflicts
		// child1__items: items (for the JSON field)
		// child2__items: items { id } (for the relation field)
		expect(graphqlQuery).toContain('child1__items: items');
		expect(graphqlQuery).toContain('child2__items: items');

		// Verify the inline fragments are present
		expect(graphqlQuery).toContain('... on child1');
		expect(graphqlQuery).toContain('... on child2');
	});

	it('should correctly transform aliased response data back to original field names', () => {
		setupMocksForIssue25476();

		const fields: string[] = ['children.collection', 'children.item:child1.items', 'children.item:child2.items'];

		const { m2aAliasMap } = getGraphqlQueryFields(fields, 'parent');

		// Simulate the GraphQL response with aliased fields
		const graphqlResponse = {
			id: 'parent-1',
			children: [
				{
					id: 'junction-1',
					collection: 'child1',
					item: {
						id: 'child1-item-1',
						child1__items: { key: 'value', nested: [1, 2, 3] }, // JSON field with aliased name
					},
				},
				{
					id: 'junction-2',
					collection: 'child2',
					item: {
						id: 'child2-item-1',
						child2__items: [{ id: 'related-1' }, { id: 'related-2' }], // Relation field with aliased name
					},
				},
			],
		};

		// Transform the response to restore original field names
		const transformedData = transformM2AAliases(graphqlResponse, m2aAliasMap);

		// The transformed data should have original field names
		expect(transformedData).toEqual({
			id: 'parent-1',
			children: [
				{
					id: 'junction-1',
					collection: 'child1',
					item: {
						id: 'child1-item-1',
						items: { key: 'value', nested: [1, 2, 3] }, // Restored to 'items'
					},
				},
				{
					id: 'junction-2',
					collection: 'child2',
					item: {
						id: 'child2-item-1',
						items: [{ id: 'related-1' }, { id: 'related-2' }], // Restored to 'items'
					},
				},
			],
		});
	});

	it('should handle multiple M2A fields targeting same child collections with isolated alias maps', () => {
		// This test addresses the feedback: when items and items2 both target child1/child2,
		// each should have its own isolated alias map entry
		vi.mocked(getRelatedCollection).mockImplementation((collection, field) => {
			if (collection === 'parent' && (field === 'items' || field === 'items2')) {
				return { relatedCollection: 'parent_items' };
			}

			if (collection === 'child1' && field === 'items') {
				return null; // JSON field - not a relation
			}

			if (collection === 'child2' && field === 'items') {
				return { relatedCollection: 'child2_items' }; // 1:N relation
			}

			return null;
		});

		const fieldsStore = mockedStore(useFieldsStore());

		fieldsStore.getPrimaryKeyFieldForCollection.mockImplementation((collection) => {
			switch (collection) {
				case 'parent_items':
				case 'child1':
				case 'child2':
				case 'child2_items':
					return { field: 'id' } as Field;
				default:
					return null;
			}
		});

		const relationsStore = mockedStore(useRelationsStore());

		relationsStore.getRelationForField.mockImplementation((currentCollection, sourceField) => {
			if (currentCollection === 'parent_items' && sourceField === 'item') {
				return {
					meta: { one_collection_field: 'collection' },
				} as Relation;
			}

			return null;
		});

		const fields: string[] = [
			'items.collection',
			'items.item:child1.items',
			'items.item:child2.items',
			'items2.collection',
			'items2.item:child1.items',
			'items2.item:child2.items',
		];

		const collection = 'parent';

		const result = getGraphqlQueryFields(fields, collection);

		// Both M2A fields should have separate entries in the alias map
		expect(result.m2aAliasMap).toHaveProperty('items.item');
		expect(result.m2aAliasMap).toHaveProperty('items2.item');

		// Each should have its own collectionField and aliases
		expect(result.m2aAliasMap['items.item']).toEqual({
			collectionField: 'collection',
			junctionField: 'item',
			aliases: {
				child1: { child1__items: 'items' },
				child2: { child2__items: 'items' },
			},
		});

		expect(result.m2aAliasMap['items2.item']).toEqual({
			collectionField: 'collection',
			junctionField: 'item',
			aliases: {
				child1: { child1__items: 'items' },
				child2: { child2__items: 'items' },
			},
		});

		// Verify the query fields structure
		expect(result.queryFields.items.item.__on).toBeDefined();
		expect(result.queryFields.items2.item.__on).toBeDefined();
	});

	it('should use custom collection field name from relation meta', () => {
		setupMocksForIssue25476();

		// Mock a relation with custom collection field name
		const relationsStore = mockedStore(useRelationsStore());

		relationsStore.getRelationForField.mockImplementation((currentCollection, sourceField) => {
			if (currentCollection === 'parent_children' && sourceField === 'item') {
				return {
					meta: { one_collection_field: 'collection_ref' }, // Custom field name
				} as Relation;
			}

			return null;
		});

		const fields: string[] = ['children.collection_ref', 'children.item:child1.items', 'children.item:child2.items'];

		const collection = 'parent';

		const result = getGraphqlQueryFields(fields, collection);

		// The alias map should use the custom collection field name
		expect(result.m2aAliasMap['children.item']).toEqual({
			collectionField: 'collection_ref', // Should use the custom field name
			junctionField: 'item',
			aliases: {
				child1: { child1__items: 'items' },
				child2: { child2__items: 'items' },
			},
		});
	});

	it('should store custom junction field name (e.g., value instead of item)', () => {
		// This test verifies that when the junction field is renamed (e.g., 'value' instead of 'item'),
		// the junctionField is correctly extracted and stored in the alias map
		vi.mocked(getRelatedCollection).mockImplementation((collection, field) => {
			if (collection === 'parent' && field === 'children') {
				return { relatedCollection: 'parent_children' };
			}

			if (collection === 'child1' && field === 'items') {
				return null; // JSON field - not a relation
			}

			if (collection === 'child2' && field === 'items') {
				return { relatedCollection: 'child2_items' }; // 1:N relation
			}

			return null;
		});

		const fieldsStore = mockedStore(useFieldsStore());

		fieldsStore.getPrimaryKeyFieldForCollection.mockImplementation((collection) => {
			switch (collection) {
				case 'parent_children':
				case 'child1':
				case 'child2':
				case 'child2_items':
					return { field: 'id' } as Field;
				default:
					return null;
			}
		});

		const relationsStore = mockedStore(useRelationsStore());

		relationsStore.getRelationForField.mockImplementation((currentCollection, sourceField) => {
			// Mock for 'value' junction field instead of 'item'
			if (currentCollection === 'parent_children' && sourceField === 'value') {
				return {
					meta: { one_collection_field: 'collection' },
				} as Relation;
			}

			return null;
		});

		const fields: string[] = ['children.collection', 'children.value:child1.items', 'children.value:child2.items'];

		const collection = 'parent';

		const result = getGraphqlQueryFields(fields, collection);

		// The alias map should use 'value' as the junctionField, not hardcode 'item'
		expect(result.m2aAliasMap['children.value']).toEqual({
			collectionField: 'collection',
			junctionField: 'value', // Should use the actual field name from the specification
			aliases: {
				child1: { child1__items: 'items' },
				child2: { child2__items: 'items' },
			},
		});
	});
});

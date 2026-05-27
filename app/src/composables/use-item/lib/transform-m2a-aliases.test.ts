import { describe, expect, it } from 'vitest';
import type { M2AAliasMap } from './get-graphql-query-fields.js';
import { transformM2AAliases } from './transform-m2a-aliases.js';

describe('transformM2AAliases', () => {
	it('should return data unchanged when alias map is empty', () => {
		const data = { id: 1, name: 'test' };
		const result = transformM2AAliases(data, {});

		expect(result).toEqual(data);
	});

	it('should return null/undefined unchanged', () => {
		expect(transformM2AAliases(null, {})).toBeNull();
		expect(transformM2AAliases(undefined, {})).toBeUndefined();
	});

	it('should transform aliased fields in M2A items based on collection field', () => {
		const aliasMap: M2AAliasMap = {
			'children.item': {
				collectionField: 'collection',
				junctionField: 'item',
				aliases: {
					child1: { child1__items: 'items' },
					child2: { child2__items: 'items' },
				},
			},
		};

		const data = {
			id: 1,
			children: [
				{
					id: 10,
					collection: 'child1',
					item: {
						id: 100,
						child1__items: { key: 'value' }, // JSON field - aliased
					},
				},
				{
					id: 11,
					collection: 'child2',
					item: {
						id: 101,
						child2__items: [{ id: 200 }], // Relation field - aliased
					},
				},
			],
		};

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual({
			id: 1,
			children: [
				{
					id: 10,
					collection: 'child1',
					item: {
						id: 100,
						items: { key: 'value' }, // Transformed back to 'items'
					},
				},
				{
					id: 11,
					collection: 'child2',
					item: {
						id: 101,
						items: [{ id: 200 }], // Transformed back to 'items'
					},
				},
			],
		});
	});

	it('should handle deeply nested M2A structures', () => {
		const aliasMap: M2AAliasMap = {
			'blocks.item': {
				collectionField: 'collection',
				junctionField: 'item',
				aliases: {
					block_text: { block_text__content: 'content' },
					block_image: { block_image__content: 'content', block_image__url: 'url' },
				},
			},
		};

		const data = {
			blocks: [
				{
					collection: 'block_text',
					item: {
						block_text__content: 'Hello world',
					},
				},
				{
					collection: 'block_image',
					item: {
						block_image__content: 'Image caption',
						block_image__url: 'https://example.com/image.jpg',
					},
				},
			],
		};

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual({
			blocks: [
				{
					collection: 'block_text',
					item: {
						content: 'Hello world',
					},
				},
				{
					collection: 'block_image',
					item: {
						content: 'Image caption',
						url: 'https://example.com/image.jpg',
					},
				},
			],
		});
	});

	it('should not transform fields when collection field is not present', () => {
		const aliasMap: M2AAliasMap = {
			'children.item': {
				collectionField: 'collection',
				junctionField: 'item',
				aliases: {
					child1: { child1__items: 'items' },
				},
			},
		};

		const data = {
			id: 1,
			// No 'collection' field, so no transformation should happen
			child1__items: 'should stay as is',
		};

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual({
			id: 1,
			child1__items: 'should stay as is',
		});
	});

	it('should use custom collection field name', () => {
		const aliasMap: M2AAliasMap = {
			'items.item': {
				collectionField: 'type', // Custom collection field name
				junctionField: 'item',
				aliases: {
					child1: { child1__data: 'data' },
				},
			},
		};

		const data = {
			type: 'child1', // Custom collection field
			item: {
				child1__data: 'test value',
			},
		};

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual({
			type: 'child1',
			item: {
				data: 'test value',
			},
		});
	});

	it('should strip __typename field from response', () => {
		const aliasMap: M2AAliasMap = {
			'children.item': {
				collectionField: 'collection',
				junctionField: 'item',
				aliases: {
					child1: { child1__items: 'items' },
				},
			},
		};

		const data = {
			__typename: 'Parent',
			id: 1,
			children: [
				{
					__typename: 'ParentChildren',
					collection: 'child1',
					item: {
						__typename: 'child1',
						child1__items: 'value',
					},
				},
			],
		};

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual({
			id: 1,
			children: [
				{
					collection: 'child1',
					item: {
						items: 'value',
					},
				},
			],
		});
	});

	it('should handle arrays at the root level', () => {
		const aliasMap: M2AAliasMap = {
			'items.item': {
				collectionField: 'collection',
				junctionField: 'item',
				aliases: {
					child1: { child1__field: 'field' },
				},
			},
		};

		const data = [
			{ collection: 'child1', item: { child1__field: 'value1' } },
			{ collection: 'child1', item: { child1__field: 'value2' } },
		];

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual([
			{ collection: 'child1', item: { field: 'value1' } },
			{ collection: 'child1', item: { field: 'value2' } },
		]);
	});

	it('should preserve non-aliased fields', () => {
		const aliasMap: M2AAliasMap = {
			'items.item': {
				collectionField: 'collection',
				junctionField: 'item',
				aliases: {
					child1: { child1__special: 'special' },
				},
			},
		};

		const data = {
			collection: 'child1',
			id: 1,
			name: 'test',
			item: {
				child1__special: 'aliased value',
				regular_field: 'untouched',
			},
		};

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual({
			collection: 'child1',
			id: 1,
			name: 'test',
			item: {
				special: 'aliased value',
				regular_field: 'untouched',
			},
		});
	});

	it('should handle multiple M2A fields targeting same child collections independently', () => {
		// This test addresses the feedback about multiple M2A fields (items and items2)
		// both targeting the same child collections - they should be isolated
		const aliasMap: M2AAliasMap = {
			'items.item': {
				collectionField: 'collection',
				junctionField: 'item',
				aliases: {
					child1: { child1__items: 'items' },
					child2: { child2__items: 'items' },
				},
			},
			'items2.item': {
				collectionField: 'collection',
				junctionField: 'item',
				aliases: {
					child1: { child1__items: 'items' },
					child2: { child2__items: 'items' },
				},
			},
		};

		const data = {
			id: 'parent-1',
			items: [
				{
					id: 'junction-1',
					collection: 'child1',
					item: {
						id: 'child1-item-1',
						child1__items: 'value from items relation',
					},
				},
			],
			items2: [
				{
					id: 'junction-2',
					collection: 'child1',
					item: {
						id: 'child1-item-2',
						child1__items: 'value from items2 relation',
					},
				},
			],
		};

		const result = transformM2AAliases(data, aliasMap);

		// Both relations should be transformed independently
		expect(result).toEqual({
			id: 'parent-1',
			items: [
				{
					id: 'junction-1',
					collection: 'child1',
					item: {
						id: 'child1-item-1',
						items: 'value from items relation',
					},
				},
			],
			items2: [
				{
					id: 'junction-2',
					collection: 'child1',
					item: {
						id: 'child1-item-2',
						items: 'value from items2 relation',
					},
				},
			],
		});
	});

	it('should handle custom collection field names (e.g., collection_ref)', () => {
		// This test addresses the feedback about custom collection field names
		const aliasMap: M2AAliasMap = {
			'items.item': {
				collectionField: 'collection_ref', // Custom field name
				junctionField: 'item',
				aliases: {
					child1: { child1__items: 'items' },
					child2: { child2__items: 'items' },
				},
			},
		};

		const data = {
			id: 'parent-1',
			items: [
				{
					id: 'junction-1',
					collection_ref: 'child1', // Using custom field name
					item: {
						id: 'child1-item-1',
						child1__items: 'test value',
					},
				},
				{
					id: 'junction-2',
					collection_ref: 'child2', // Using custom field name
					item: {
						id: 'child2-item-1',
						child2__items: 'test value 2',
					},
				},
			],
		};

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual({
			id: 'parent-1',
			items: [
				{
					id: 'junction-1',
					collection_ref: 'child1',
					item: {
						id: 'child1-item-1',
						items: 'test value',
					},
				},
				{
					id: 'junction-2',
					collection_ref: 'child2',
					item: {
						id: 'child2-item-1',
						items: 'test value 2',
					},
				},
			],
		});
	});

	it('should handle multiple M2A fields sharing same junction column by using field path', () => {
		// This test addresses the issue where items2 and items3 share the same junction table/column
		// (both use 'collection' field) but alias different fields (child1__bar vs child1__foo)
		// Without field path tracking, the first matching config would be reused everywhere
		const aliasMap: M2AAliasMap = {
			'items2.item': {
				collectionField: 'collection', // Same junction column as items3
				junctionField: 'item',
				aliases: {
					child1: { child1__bar: 'bar' }, // Different aliased field
				},
			},
			'items3.item': {
				collectionField: 'collection', // Same junction column as items2
				junctionField: 'item',
				aliases: {
					child1: { child1__foo: 'foo' }, // Different aliased field
				},
			},
		};

		const data = {
			id: 'parent-1',
			items2: [
				{
					id: 'junction-1',
					collection: 'child1', // Same collection field name
					item: {
						id: 'child1-item-1',
						child1__bar: 'value from items2', // Should transform to 'bar'
					},
				},
			],
			items3: [
				{
					id: 'junction-2',
					collection: 'child1', // Same collection field name
					item: {
						id: 'child1-item-2',
						child1__foo: 'value from items3', // Should transform to 'foo'
					},
				},
			],
		};

		const result = transformM2AAliases(data, aliasMap);

		// Each relation should be transformed independently using its own field path
		expect(result).toEqual({
			id: 'parent-1',
			items2: [
				{
					id: 'junction-1',
					collection: 'child1',
					item: {
						id: 'child1-item-1',
						bar: 'value from items2', // Correctly transformed using items2.item config
					},
				},
			],
			items3: [
				{
					id: 'junction-2',
					collection: 'child1',
					item: {
						id: 'child1-item-2',
						foo: 'value from items3', // Correctly transformed using items3.item config
					},
				},
			],
		});
	});

	it('should handle renamed junction field (e.g., value instead of item)', () => {
		// This test addresses the issue where the junction M2O field is renamed in advanced mode
		// (e.g., from 'item' to 'value'). The transformer should use the actual junction field name
		// instead of hardcoding 'item'
		const aliasMap: M2AAliasMap = {
			'items.value': {
				collectionField: 'collection',
				junctionField: 'value', // Renamed junction field
				aliases: {
					child1: { child1__items: 'items' },
					child2: { child2__items: 'items' },
				},
			},
		};

		const data = {
			id: 'parent-1',
			items: [
				{
					id: 'junction-1',
					collection: 'child1',
					value: {
						// Using 'value' instead of 'item'
						id: 'child1-item-1',
						child1__items: 'test value',
					},
				},
				{
					id: 'junction-2',
					collection: 'child2',
					value: {
						// Using 'value' instead of 'item'
						id: 'child2-item-1',
						child2__items: 'test value 2',
					},
				},
			],
		};

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual({
			id: 'parent-1',
			items: [
				{
					id: 'junction-1',
					collection: 'child1',
					value: {
						id: 'child1-item-1',
						items: 'test value', // Correctly transformed
					},
				},
				{
					id: 'junction-2',
					collection: 'child2',
					value: {
						id: 'child2-item-1',
						items: 'test value 2', // Correctly transformed
					},
				},
			],
		});
	});
});

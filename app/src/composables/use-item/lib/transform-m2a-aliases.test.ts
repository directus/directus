import { describe, expect, it } from 'vitest';
import { transformM2AAliases } from './transform-m2a-aliases.js';
import type { M2AAliasMap } from './get-graphql-query-fields.js';

describe('transformM2AAliases', () => {
	it('should return data unchanged when alias map is empty', () => {
		const data = { id: 1, name: 'test' };
		const result = transformM2AAliases(data, {});

		expect(result).toEqual(data);
	});

	it('should return null/undefined unchanged', () => {
		expect(transformM2AAliases(null, { collection: {} })).toBeNull();
		expect(transformM2AAliases(undefined, { collection: {} })).toBeUndefined();
	});

	it('should transform aliased fields in M2A items based on collection field', () => {
		const aliasMap: M2AAliasMap = {
			child1: { child1__items: 'items' },
			child2: { child2__items: 'items' },
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
			block_text: { block_text__content: 'content' },
			block_image: { block_image__content: 'content', block_image__url: 'url' },
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
			child1: { child1__items: 'items' },
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
			child1: { child1__data: 'data' },
		};

		const data = {
			type: 'child1', // Custom collection field
			child1__data: 'test value',
		};

		const result = transformM2AAliases(data, aliasMap, 'type');

		expect(result).toEqual({
			type: 'child1',
			data: 'test value',
		});
	});

	it('should strip __typename field from response', () => {
		const aliasMap: M2AAliasMap = {
			child1: { child1__items: 'items' },
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
			child1: { child1__field: 'field' },
		};

		const data = [
			{ collection: 'child1', child1__field: 'value1' },
			{ collection: 'child1', child1__field: 'value2' },
		];

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual([
			{ collection: 'child1', field: 'value1' },
			{ collection: 'child1', field: 'value2' },
		]);
	});

	it('should preserve non-aliased fields', () => {
		const aliasMap: M2AAliasMap = {
			child1: { child1__special: 'special' },
		};

		const data = {
			collection: 'child1',
			id: 1,
			name: 'test',
			child1__special: 'aliased value',
			regular_field: 'untouched',
		};

		const result = transformM2AAliases(data, aliasMap);

		expect(result).toEqual({
			collection: 'child1',
			id: 1,
			name: 'test',
			special: 'aliased value',
			regular_field: 'untouched',
		});
	});
});

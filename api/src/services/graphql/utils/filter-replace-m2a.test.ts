import { RelationBuilder, SchemaBuilder } from '@directus/schema-builder';
import { describe, expect, test } from 'vitest';
import { filterReplaceM2A, filterReplaceM2ADeep } from './filter-replace-m2a.js';

const schema = new SchemaBuilder()
	.collection('article', (c) => {
		c.field('id').id();
		c.field('author').m2o('user');

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

describe('filterReplaceM2A', () => {
	test('empty filter', () => {
		const result = filterReplaceM2A({}, 'article', { collections: {}, relations: [] });

		expect(result).toEqual({});
	});

	test('filter with aliases field', () => {
		const result = filterReplaceM2A(
			{
				id: { _eq: 1 },
				aliased_blocks: {
					anyitem__text: {
						id: { _eq: 1 },
						content: { _eq: 'Hello World' },
					},
				},
			},
			'article',
			schema,
			{ aliasMap: { aliased_blocks: 'blocks' } },
		);

		expect(result).toEqual({
			id: { _eq: 1 },
			aliased_blocks: {
				'anyitem:text': {
					id: { _eq: 1 },
					content: { _eq: 'Hello World' },
				},
			},
		});
	});

	test('filter with no relations', () => {
		const result = filterReplaceM2A(
			{
				id: {
					_eq: 1,
				},
				some: {
					_eq: 'value',
				},
			},
			'article',
			{ collections: {}, relations: [] },
		);

		expect(result).toEqual({
			id: {
				_eq: 1,
			},
			some: {
				_eq: 'value',
			},
		});
	});

	test('filter with a m2o relation', () => {
		const result = filterReplaceM2A(
			{
				id: { _eq: 1 },
				author: {
					id: { _eq: 1 },
					name: { _eq: 'John Doe' },
				},
			},
			'article',
			schema,
		);

		expect(result).toEqual({
			id: { _eq: 1 },
			author: {
				id: { _eq: 1 },
				name: { _eq: 'John Doe' },
			},
		});
	});

	test('filter with a a2o relation', () => {
		const result = filterReplaceM2A(
			{
				id: { _eq: 1 },
				blocks: {
					anyitem__text: {
						id: { _eq: 1 },
						content: { _eq: 'Hello World' },
					},
				},
			},
			'article',
			schema,
		);

		expect(result).toEqual({
			id: { _eq: 1 },
			blocks: {
				'anyitem:text': {
					id: { _eq: 1 },
					content: { _eq: 'Hello World' },
				},
			},
		});
	});

	test('filter with a fake a2o relation', () => {
		const result = filterReplaceM2A(
			{
				id: { _eq: 1 },
				blocks: {
					item__text: {
						id: { _eq: 1 },
						content: { _eq: 'Hello World' },
					},
				},
			},
			'article',
			schema,
		);

		expect(result).toEqual({
			id: { _eq: 1 },
			blocks: {
				item__text: {
					id: { _eq: 1 },
					content: { _eq: 'Hello World' },
				},
			},
		});
	});

	test('filter with a a2o relation inside _and', () => {
		const result = filterReplaceM2A(
			{
				_and: [
					{
						blocks: {
							anyitem__text: {
								id: { _eq: 1 },
								content: { _eq: 'Hello World' },
							},
						},
					},
				],
			},
			'article',
			schema,
		);

		expect(result).toEqual({
			_and: [
				{
					blocks: {
						'anyitem:text': {
							id: { _eq: 1 },
							content: { _eq: 'Hello World' },
						},
					},
				},
			],
		});
	});

	test('filter with a a2o relation and wrong target collection', () => {
		const result = filterReplaceM2A(
			{
				id: { _eq: 1 },
				blocks: {
					anyitem__wrong: {
						id: { _eq: 1 },
						content: { _eq: 'Hello World' },
					},
				},
			},
			'article',
			schema,
		);

		expect(result).toEqual({
			id: { _eq: 1 },
			blocks: {
				anyitem__wrong: {
					id: { _eq: 1 },
					content: { _eq: 'Hello World' },
				},
			},
		});
	});
});

describe('filterReplaceM2aDeep', () => {
	test('empty filter', () => {
		const result = filterReplaceM2ADeep({}, 'article', { collections: {}, relations: [] });

		expect(result).toEqual({});
	});

	test('deep with filter', () => {
		const result = filterReplaceM2ADeep(
			{
				blocks: {
					_filter: {
						id: { _eq: 1 },
						content: { _eq: 'Hello World' },
					},
				},
			},
			'article',
			schema,
		);

		expect(result).toEqual({
			blocks: {
				_filter: {
					id: { _eq: 1 },
					content: { _eq: 'Hello World' },
				},
			},
		});
	});

	test('filter with aliased relation', () => {
		const result = filterReplaceM2ADeep(
			{
				aliased_blocks: {
					_filter: {
						anyitem__text: {
							id: { _eq: 1 },
							content: { _eq: 'Hello World' },
						},
					},
				},
			},
			'article',
			schema,
			{ aliasMap: { aliased_blocks: 'blocks' } },
		);

		expect(result).toEqual({
			aliased_blocks: {
				_filter: {
					'anyitem:text': {
						id: { _eq: 1 },
						content: { _eq: 'Hello World' },
					},
				},
			},
		});
	});

	test('filter with nested aliased relation', () => {
		const result = filterReplaceM2ADeep(
			{
				aliased_blocks: {
					article_id: {
						_alias: { aliased_blocks: 'blocks' },
						aliased_blocks: {
							_filter: {
								anyitem__text: {
									id: { _eq: 1 },
									content: { _eq: 'Hello World' },
								},
							},
						},
					},
					_filter: {
						anyitem__text: {
							id: { _eq: 1 },
							content: { _eq: 'Hello World' },
						},
					},
				},
			},
			'article',
			schema,
			{ aliasMap: { aliased_blocks: 'blocks' } },
		);

		expect(result).toEqual({
			aliased_blocks: {
				article_id: {
					_alias: {
						aliased_blocks: 'blocks',
					},
					aliased_blocks: {
						_filter: {
							'anyitem:text': {
								id: { _eq: 1 },
								content: { _eq: 'Hello World' },
							},
						},
					},
				},
				_filter: {
					'anyitem:text': {
						id: { _eq: 1 },
						content: { _eq: 'Hello World' },
					},
				},
			},
		});
	});

	test('deep with filter having a2o', () => {
		const result = filterReplaceM2ADeep(
			{
				blocks: {
					_filter: {
						anyitem__text: {
							id: { _eq: 1 },
							content: { _eq: 'Hello World' },
						},
					},
				},
			},
			'article',
			schema,
		);

		expect(result).toEqual({
			blocks: {
				_filter: {
					'anyitem:text': {
						id: { _eq: 1 },
						content: { _eq: 'Hello World' },
					},
				},
			},
		});
	});

	test('deep with nested filter having a2o', () => {
		const result = filterReplaceM2ADeep(
			{
				blocks: {
					anyitem__text: {
						blocks: {
							_filter: {
								id: { _eq: 1 },
							},
						},
					},
				},
			},
			'article',
			schema,
		);

		expect(result).toEqual({
			blocks: {
				'anyitem:text': {
					blocks: {
						_filter: {
							id: { _eq: 1 },
						},
					},
				},
			},
		});
	});

	test('deep with filter having a2o on wrong deep', () => {
		const result = filterReplaceM2ADeep(
			{
				wrong: {
					_filter: {
						anyitem__text: {
							id: { _eq: 1 },
							content: { _eq: 'Hello World' },
						},
					},
				},
			},
			'article',
			schema,
		);

		expect(result).toEqual({
			wrong: {
				_filter: {
					anyitem__text: {
						id: { _eq: 1 },
						content: { _eq: 'Hello World' },
					},
				},
			},
		});
	});
});

import { SchemaBuilder } from '@directus/schema-builder';
import type { Relation } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { A2MNode, FieldNode, M2ONode, O2MNode, VersionedNode } from '../../../types/ast.js';
import { applyVersionedA2OParentFilter, applyVersionedParentFilter } from '../../../versioning/run.js';
import { applyParentFilters } from './apply-parent-filters.js';

vi.mock('../../../versioning/run.js', () => ({
	applyVersionedParentFilter: vi.fn(),
	applyVersionedA2OParentFilter: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
});

const schema = new SchemaBuilder()
	.collection('authors', (c) => {
		c.field('id').id();
	})
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('author').m2o('authors', 'articles');
	})
	.collection('images', (c) => {
		c.field('uuid').uuid().primary();
	})
	.collection('books', (c) => {
		c.field('id').id();
	})
	.collection('chapters', (c) => {
		c.field('id').id();
		c.field('sort').integer();
		c.field('book').m2o('books', 'chapters', (r) => r.options({ meta: { sort_field: 'sort' } }));
	})
	.collection('blocks', (c) => {
		c.field('id').id();
		c.field('item').a2o(['articles', 'images']);
	})
	.build();

function getRelation(collection: string, field: string): Relation {
	return schema.relations.find((relation) => relation.collection === collection && relation.field === field)!;
}

const versioning = { reference: null } as unknown as VersionedNode;

function m2oNode(overrides: Partial<M2ONode> = {}): M2ONode {
	return {
		type: 'm2o',
		name: 'authors',
		fieldKey: 'author',
		parentKey: 'id',
		relatedKey: 'id',
		children: [],
		query: {},
		whenCase: [],
		cases: [],
		relation: getRelation('articles', 'author'),
		...overrides,
	};
}

function o2mNode(overrides: Partial<O2MNode> = {}): O2MNode {
	return {
		type: 'o2m',
		name: 'articles',
		fieldKey: 'articles',
		parentKey: 'id',
		relatedKey: 'id',
		children: [],
		query: {},
		whenCase: [],
		cases: [],
		relation: getRelation('articles', 'author'),
		...overrides,
	};
}

function a2oNode(overrides: Partial<A2MNode> = {}): A2MNode {
	return {
		type: 'a2o',
		names: ['articles', 'images'],
		fieldKey: 'item',
		parentKey: 'id',
		relatedKey: { articles: 'id', images: 'uuid' },
		children: { articles: [], images: [] },
		query: {},
		whenCase: [],
		cases: { articles: [], images: [] },
		relation: getRelation('blocks', 'item'),
		...overrides,
	};
}

describe('applyParentFilters', () => {
	test('skips nodes without a relation', () => {
		const node = m2oNode({ relation: undefined as unknown as Relation });

		applyParentFilters(schema, [node], [{ author: 1 }]);

		expect(node.query).toEqual({});
	});

	test('returns the same nodes array', () => {
		const nodes = [m2oNode()];

		expect(applyParentFilters(schema, nodes, [])).toBe(nodes);
	});

	test('accepts a single parent item', () => {
		const node = m2oNode();

		applyParentFilters(schema, [node], { author: 1 });

		expect(node.query.filter).toEqual({ id: { _in: [1] } });
	});

	describe('m2o', () => {
		test('filters related primary key by unique, non-nil parent foreign keys', () => {
			const node = m2oNode();

			applyParentFilters(schema, [node], [{ author: 1 }, { author: 2 }, { author: 1 }, { author: null }, {}]);

			expect(node.query.filter).toEqual({ id: { _in: [1, 2] } });
		});

		test('merges into an existing filter', () => {
			const node = m2oNode({ query: { filter: { name: { _eq: 'a' } } } });

			applyParentFilters(schema, [node], [{ author: 1 }]);

			expect(node.query.filter).toEqual({ name: { _eq: 'a' }, id: { _in: [1] } });
		});

		test('delegates to versioning helper when versioned', () => {
			const node = m2oNode({ versioning });
			const parents = [{ author: 1 }];

			applyParentFilters(schema, [node], parents);

			expect(applyVersionedParentFilter).toHaveBeenCalledWith({ ...node, versioning }, parents, schema);
			expect(node.query.filter).toBeUndefined();
		});
	});

	describe('o2m', () => {
		test('filters related foreign key by unique, non-nil parent primary keys', () => {
			const node = o2mNode();

			applyParentFilters(schema, [node], [{ id: 1 }, { id: 2 }, { id: 2 }, { id: null }]);

			expect(node.query.filter).toEqual({ author: { _in: [1, 2] } });
		});

		test('adds the foreign key field to children if missing', () => {
			const node = o2mNode();

			applyParentFilters(schema, [node], [{ id: 1 }]);

			expect(node.children).toEqual([
				{ type: 'field', name: 'author', fieldKey: 'author', whenCase: [], alias: false },
			]);
		});

		test('does not duplicate the foreign key field if already selected', () => {
			const field: FieldNode = { type: 'field', name: 'author', fieldKey: 'author', whenCase: [], alias: false };
			const node = o2mNode({ children: [field] });

			applyParentFilters(schema, [node], [{ id: 1 }]);

			expect(node.children).toEqual([field]);
		});

		test('adds the sort field to children if configured', () => {
			const node = o2mNode({ name: 'chapters', relation: getRelation('chapters', 'book') });

			applyParentFilters(schema, [node], [{ id: 1 }]);

			expect(node.children.map((child) => (child as FieldNode).name)).toEqual(['book', 'sort']);
		});

		test('does not duplicate the sort field if already selected', () => {
			const sort: FieldNode = { type: 'field', name: 'sort', fieldKey: 'sort', whenCase: [], alias: false };

			const node = o2mNode({ name: 'chapters', children: [sort], relation: getRelation('chapters', 'book') });

			applyParentFilters(schema, [node], [{ id: 1 }]);

			expect(node.children.map((child) => (child as FieldNode).name)).toEqual(['sort', 'book']);
		});

		test('adds required fields and delegates to versioning helper when versioned', () => {
			const node = o2mNode({ versioning });
			const parents = [{ id: 1 }];

			applyParentFilters(schema, [node], parents);

			expect(node.children).toHaveLength(1);
			expect(applyVersionedParentFilter).toHaveBeenCalledWith({ ...node, versioning }, parents, schema);
			expect(node.query.filter).toBeUndefined();
		});
	});

	describe('a2o', () => {
		const parents = [
			{ collection: 'articles', item: 1 },
			{ collection: 'articles', item: 2 },
			{ collection: 'articles', item: 1 },
			{ collection: 'images', item: 'abc' },
			{ collection: 'images', item: null },
		];

		test('filters each related collection by its keys and limits to the key count', () => {
			const node = a2oNode();

			applyParentFilters(schema, [node], parents);

			expect(node.query).toEqual({
				articles: { filter: { id: { _in: [1, 2] } }, limit: 2 },
				images: { filter: { uuid: { _in: ['abc'] } }, limit: 1 },
			});
		});

		test('uses an empty filter for collections without parents', () => {
			const node = a2oNode();

			applyParentFilters(schema, [node], [{ collection: 'articles', item: 1 }]);

			expect(node.query['images']).toEqual({ filter: { uuid: { _in: [] } }, limit: 0 });
		});

		test('always calls the versioned a2o helper', () => {
			const node = a2oNode();

			applyParentFilters(schema, [node], parents);

			expect(applyVersionedA2OParentFilter).toHaveBeenCalledWith(node, parents, schema);
		});

		test('skips collections that are versioned', () => {
			const node = a2oNode({ versioning: { images: versioning } });

			applyParentFilters(schema, [node], parents);

			expect(node.query).toEqual({ articles: { filter: { id: { _in: [1, 2] } }, limit: 2 } });
		});
	});

	test('handles multiple nodes of different types', () => {
		const m2o = m2oNode();
		const o2m = o2mNode({ fieldKey: 'posts' });

		applyParentFilters(schema, [m2o, o2m], [{ id: 10, author: 1 }]);

		expect(m2o.query.filter).toEqual({ id: { _in: [1] } });
		expect(o2m.query.filter).toEqual({ author: { _in: [10] } });
	});
});

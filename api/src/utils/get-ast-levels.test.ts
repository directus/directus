import { describe, expect, test } from 'vitest';
import type { AST } from '../types/ast.js';
import { getAstLevels } from './get-ast-levels.js';

function createAst(): AST {
	return {
		type: 'root',
		name: 'articles',
		query: {},
		cases: [],
		children: [
			{ type: 'field', name: 'title', fieldKey: 'title', alias: false, whenCase: [] },
			{
				type: 'm2o',
				name: 'authors',
				fieldKey: 'author',
				relation: { collection: 'articles', field: 'author', related_collection: 'authors' },
				query: {},
				cases: [],
				children: [
					{
						type: 'o2m',
						name: 'books',
						fieldKey: 'books',
						relation: { collection: 'books', field: 'author', related_collection: 'authors' },
						query: {},
						cases: [],
						children: [],
					},
				],
			},
			{
				type: 'a2o',
				names: ['pages', 'posts'],
				fieldKey: 'item',
				relation: { collection: 'articles', field: 'item', related_collection: null },
				query: { pages: {}, posts: {} },
				cases: {},
				children: { pages: [], posts: [] },
			},
			{
				type: 'functionField',
				name: 'count',
				fieldKey: 'count(tags)',
				relatedCollection: 'tags',
				query: {},
				cases: [],
				whenCase: [],
			},
		],
	} as unknown as AST;
}

describe('getAstLevels', () => {
	test('yields the levels of the AST, parents first', () => {
		const levels = [...getAstLevels(createAst())];

		expect(
			levels.map(({ collection, path, parent }) => [collection, path.join('.'), parent?.collection ?? null]),
		).toEqual([
			['articles', '', null],
			['authors', 'author', 'articles'],
			['books', 'author.books', 'authors'],
			['pages', 'item:pages', 'articles'],
			['posts', 'item:posts', 'articles'],
		]);
	});

	test('prefixes the paths with the given path', () => {
		const [root] = getAstLevels(createAst(), ['parent']);

		expect(root!.path).toEqual(['parent']);
	});

	test('writes to the related collection of a2o nodes', () => {
		const ast = createAst();
		const pages = [...getAstLevels(ast)].find(({ collection }) => collection === 'pages')!;

		pages.cases = [{ id: { _eq: 1 } }];
		pages.query = { limit: 1 };

		pages.versioning = {
			query: {},
			fields: [],
			reference: null,
			shadows: {},
		};

		const a2o = ast.children[2] as any;

		expect(a2o.cases).toEqual({ pages: [{ id: { _eq: 1 } }] });
		expect(a2o.query).toEqual({ pages: { limit: 1 }, posts: {} });
		expect(a2o.versioning).toEqual({ pages: pages.versioning });
	});

	test('reads the children of a level after it has been handled', () => {
		const collections: string[] = [];

		for (const level of getAstLevels(createAst())) {
			collections.push(level.collection);

			if (level.collection === 'authors') level.children = [];
		}

		expect(collections).not.toContain('books');
	});
});

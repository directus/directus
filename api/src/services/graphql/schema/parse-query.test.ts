import type { FragmentDefinitionNode, SelectionNode } from 'graphql';
import { buildSchema } from 'graphql';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	buildArgument,
	buildField,
	buildFilterArgument,
	buildFragmentDefinition,
	buildFragmentSpread,
	buildInlineFragment,
	buildResolveInfo,
} from '../../../test-utils/graphql.js';
import { sanitizeQuery } from '../../../utils/sanitize-query.js';
import { buildSelections } from '../utils/build-selections.js';
import { getQuery } from './parse-query.js';

vi.mock('../../../utils/sanitize-query.js', () => ({
	sanitizeQuery: vi.fn(async (q) => q),
}));

vi.mock('../../../utils/validate-query.js', () => ({
	validateQuery: vi.fn(),
}));

vi.mock('../utils/filter-replace-m2a.js', () => ({
	filterReplaceM2A: vi.fn((f) => f),
	filterReplaceM2ADeep: vi.fn((d) => d),
}));

vi.mock('../utils/replace-funcs.js', () => ({
	replaceFuncs: vi.fn((v) => v),
}));

const mockSchema = { relations: [] } as any;
const mockAccountability = null;
const mockVariableValues = {};

// test_collection.parent is A2O → child
const m2aSchema = {
	relations: [
		{
			collection: 'test_collection',
			field: 'parent',
			related_collection: null,
			meta: {
				one_collection_field: 'collection',
				one_allowed_collections: ['child'],
				one_field: null,
			},
		},
	],
} as any;

// Page → content (O2M junction) → item (A2O)
const pageM2ASchema = {
	relations: [
		{
			// O2M: Page.contents → page_content
			collection: 'page_content',
			field: 'page_id',
			related_collection: 'Page',
			meta: {
				one_field: 'contents',
				one_collection_field: null,
				one_allowed_collections: null,
			},
		},
		{
			// A2O: page_content.item → ComponentText
			collection: 'page_content',
			field: 'item',
			related_collection: null,
			meta: {
				one_collection_field: 'collection',
				one_allowed_collections: ['ComponentText'],
				one_field: null,
			},
		},
	],
} as any;

// The GraphQL schema get-types.ts generates for pageM2ASchema: `Page.contents` is a junction whose
// `item` resolves to a union of the allowed collections
const pageGqlSchema = buildSchema(`
	type ComponentText { id: ID, text: String }
	union page_content_item_union = ComponentText
	type page_content { id: ID, item: page_content_item_union }
	type count_functions { count: Int }
	type Page { id: ID, title: String, contents: [page_content], contents_func: count_functions }
	type Query { Page: [Page] }
`);

/** The selections a resolver hands to getQuery: fragments resolved against the GraphQL schema */
const resolvedSelections = (selections: SelectionNode[], fragments?: Record<string, FragmentDefinitionNode>) =>
	buildSelections(
		buildResolveInfo({
			selections,
			...(fragments && { fragments }),
			schema: pageGqlSchema,
			returnType: pageGqlSchema.getQueryType()!.getFields()['Page']!.type,
		}),
	) ?? [];

/** `contents { item { … } }`, the path to an m2a item */
const contentItem = (children: SelectionNode[]) => [
	buildField('contents', { children: [buildField('item', { children })] }),
];

describe('parseFields', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('should parse simple field selection', async () => {
		const selections = [buildField('id'), buildField('name')];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['id', 'name']);
	});

	test('should ignore __typename fields', async () => {
		const selections = [buildField('__typename'), buildField('title')];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['title']);
	});

	test('should parse field with alias', async () => {
		const selections = [buildField('author', { alias: 'writer' })];
		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['author']);
		expect(query.alias).toEqual({ writer: 'author' });
	});

	test('should parse M2A InlineFragment with schema relations', async () => {
		const selections = [buildField('parent', { children: [buildInlineFragment('child', [buildField('id')])] })];

		const query = await getQuery({}, m2aSchema, selections, mockVariableValues, mockAccountability, 'test_collection');
		expect(query.fields).toEqual(['parent:child.id']);
	});

	test('should inline non-M2A InlineFragment without type prefix', async () => {
		// Page { ...PageFragment } at root level, not M2A
		const selections = [buildInlineFragment('Page', [buildField('id'), buildField('title')])];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability, 'Page');
		expect(query.fields).toEqual(['id', 'title']);
	});

	test('should inline non-M2A InlineFragment on O2M field', async () => {
		// author { ...AuthorFragment } where author is O2M, not M2A
		const o2mSchema = {
			relations: [
				{
					collection: 'author',
					field: 'page_id',
					related_collection: 'Page',
					meta: { one_field: 'author', one_collection_field: null, one_allowed_collections: null },
				},
			],
		} as any;

		const selections = [
			buildField('author', { children: [buildInlineFragment('author', [buildField('name'), buildField('email')])] }),
		];

		const query = await getQuery({}, o2mSchema, selections, mockVariableValues, mockAccountability, 'Page');
		expect(query.fields).toEqual(['author.name', 'author.email']);
	});

	test('should parse nested selectionSet', async () => {
		const selections = [buildField('user', { children: [buildField('id'), buildField('email')] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['user.id', 'user.email']);
	});

	test('should parse field with arguments', async () => {
		const limitArg = buildArgument('limit', 10);
		const selections = [buildField('posts', { args: [limitArg] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['posts']);
	});

	test('should parse M2A InlineFragment with arguments', async () => {
		const limitArg = buildArgument('limit', 10);

		const selections = [
			buildField('parent', {
				children: [buildInlineFragment('child', [buildField('grandchild', { args: [limitArg] })])],
			}),
		];

		// Only for this call: a lasting mock would hand every later test the same query object
		vi.mocked(sanitizeQuery).mockResolvedValueOnce({ limit: 10 });

		const query = await getQuery({}, m2aSchema, selections, mockVariableValues, mockAccountability, 'test_collection');
		expect(query.fields).toEqual(['parent:child.grandchild']);

		expect(query.deep).toEqual({
			parent__child: {
				grandchild: {
					_limit: 10,
				},
			},
		});
	});

	test('should not corrupt a builtin via a prototype-polluting alias path', async () => {
		const original = Object.prototype.toString.call;

		const limitArg = buildArgument('limit', 10);

		const selections = [
			buildField('parent', {
				children: [
					buildField('some_relation', {
						alias: 'toString',
						children: [buildField('grandchild', { args: [limitArg] })],
					}),
				],
			}),
		];

		vi.mocked(sanitizeQuery).mockResolvedValueOnce({ limit: 10 });

		await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);

		expect(Object.prototype.toString.call).toBe(original);
		expect(Object.prototype.toString.call([])).toBe('[object Array]');
	});

	test('should parse _func field with selectionSet', async () => {
		const selections = [buildField('count_func', { children: [buildField('sum'), buildField('avg')] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['sum(count)', 'avg(count)']);
	});

	test('should handle empty selections', async () => {
		const query = await getQuery({}, mockSchema, [], mockVariableValues, mockAccountability);
		expect(query.fields).toEqual([]);
	});

	test('should transform json sub-field of _func with path arg into json() function string', async () => {
		const pathArg = buildArgument('path', 'color');
		const selections = [buildField('metadata_func', { children: [buildField('json', { args: [pathArg] })] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['json(metadata, color)']);
	});

	test('should transform json sub-field of _func with nested dot-path', async () => {
		const pathArg = buildArgument('path', 'dimensions.width');
		const selections = [buildField('metadata_func', { children: [buildField('json', { args: [pathArg] })] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['json(metadata, dimensions.width)']);
	});

	test('should fall back to count(field) when json sub-field has no path arg', async () => {
		const selections = [buildField('metadata_func', { children: [buildField('json'), buildField('count')] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['json(metadata)', 'count(metadata)']);
	});

	test('should not include json(field) literal when path arg is present', async () => {
		const pathArg = buildArgument('path', 'color');
		const selections = [buildField('metadata_func', { children: [buildField('json', { args: [pathArg] })] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).not.toContain('json(metadata)');
		expect(query.fields).toContain('json(metadata, color)');
	});

	test('should handle multiple json paths inside the same _func selection', async () => {
		const colorArg = buildArgument('path', 'color');
		const brandArg = buildArgument('path', 'brand');

		const selections = [
			buildField('metadata_func', {
				children: [buildField('json', { args: [colorArg] }), buildField('json', { args: [brandArg] })],
			}),
		];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toContain('json(metadata, color)');
		expect(query.fields).toContain('json(metadata, brand)');
	});

	test('should transform nested relational _func json sub-field', async () => {
		const pathArg = buildArgument('path', 'color');

		const selections = [
			buildField('category', {
				children: [buildField('metadata_func', { children: [buildField('json', { args: [pathArg] })] })],
			}),
		];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['json(category.metadata, color)']);
	});

	test('M2A InlineFragment with full relation chain produces correct paths', async () => {
		// contents → item → InlineFragment(ComponentText) with translation filter
		const translationsFilter = buildFilterArgument({ languages_code: { code: { _eq: 'en-EN' } } });

		const selections = [
			buildField('contents', {
				children: [
					buildField('item', {
						children: [
							buildInlineFragment('ComponentText', [
								buildField('id'),
								buildField('translations', { args: [translationsFilter], children: [buildField('id')] }),
							]),
						],
					}),
				],
			}),
		];

		vi.mocked(sanitizeQuery).mockResolvedValueOnce({
			filter: { languages_code: { code: { _eq: 'en-EN' } } },
		});

		const query = await getQuery({}, pageM2ASchema, selections, mockVariableValues, mockAccountability, 'Page');

		expect(query.fields).toEqual(['contents.item:ComponentText.id', 'contents.item:ComponentText.translations.id']);

		expect(query.deep).toEqual(
			expect.objectContaining({
				contents: expect.objectContaining({
					item__ComponentText: expect.objectContaining({
						translations: expect.objectContaining({
							_filter: { languages_code: { code: { _eq: 'en-EN' } } },
						}),
					}),
				}),
			}),
		);
	});

	test('should handle deeply nested fields', async () => {
		const selections = [
			buildField('parent', { children: [buildField('child', { children: [buildField('grandchild')] })] }),
		];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['parent.child.grandchild']);
	});

	test('should parse aliased relational field (alias only, no non-aliased sibling)', async () => {
		const schema = {
			relations: [
				{
					collection: 'posts',
					field: 'author',
					related_collection: 'authors',
					meta: { one_field: null, one_collection_field: null, one_allowed_collections: null },
				},
			],
		} as any;

		const selections = [buildField('author', { alias: 'a', children: [buildField('name')] })];

		const query = await getQuery({}, schema, selections, mockVariableValues, mockAccountability, 'posts');

		expect(query.fields).toContain('a.name');
		expect(query.alias).toEqual({ a: 'author' });
	});

	test('should parse aliased M2O relational field at top level', async () => {
		const schema = {
			relations: [
				{
					collection: 'posts',
					field: 'author',
					related_collection: 'authors',
					meta: { one_field: null, one_collection_field: null, one_allowed_collections: null },
				},
			],
		} as any;

		const selections = [
			buildField('author', { children: [buildField('name')] }),
			buildField('author', { alias: 'a', children: [buildField('name')] }),
		];

		const query = await getQuery({}, schema, selections, mockVariableValues, mockAccountability, 'posts');

		expect(query.fields).toContain('author.name');
		expect(query.fields).toContain('a.name');
		expect(query.alias).toEqual({ a: 'author' });
	});

	test('should parse aliased relational field inside non-M2A InlineFragment', async () => {
		const schema = {
			relations: [
				{
					collection: 'blog_post',
					field: 'author',
					related_collection: 'author',
					meta: { one_field: null, one_collection_field: null, one_allowed_collections: null },
				},
			],
		} as any;

		const selections = [
			buildInlineFragment('blog_post', [
				buildField('author', { children: [buildField('id')] }),
				buildField('author', { alias: 'authorAlias', children: [buildField('id')] }),
			]),
		];

		const query = await getQuery({}, schema, selections, mockVariableValues, mockAccountability, 'blog_post');

		expect(query.fields).toContain('author.id');
		expect(query.fields).toContain('authorAlias.id');
	});

	test('should parse aliased O2M relational field inside non-M2A InlineFragment', async () => {
		const schema = {
			relations: [
				{
					collection: 'blog_post',
					field: 'author_id',
					related_collection: 'author',
					meta: { one_field: 'posts', one_collection_field: null, one_allowed_collections: null },
				},
			],
		} as any;

		const selections = [
			buildField('author', {
				children: [
					buildInlineFragment('author', [
						buildField('posts', { children: [buildField('id')] }),
						buildField('posts', { alias: 'recentPosts', children: [buildField('id')] }),
					]),
				],
			}),
		];

		const query = await getQuery({}, schema, selections, mockVariableValues, mockAccountability, 'blog_post');

		expect(query.fields).toContain('author.posts.id');
		expect(query.fields).toContain('author.recentPosts.id');
		expect(query.deep).toEqual({ author: { _alias: { recentPosts: 'posts' } } });
	});

	test('should parse aliased M2A relational field at top level', async () => {
		const selections = [
			buildField('parent', {
				children: [buildInlineFragment('child', [buildField('id')])],
			}),
			buildField('parent', {
				alias: 'parentAlias',
				children: [buildInlineFragment('child', [buildField('id')])],
			}),
		];

		const query = await getQuery({}, m2aSchema, selections, mockVariableValues, mockAccountability, 'test_collection');

		expect(query.fields).toContain('parent:child.id');
		expect(query.fields).toContain('parentAlias:child.id');
	});
});

/**
 * A fragment is a way of writing a selection, not a thing the query knows about, so these cover what
 * getQuery makes of the selections a resolver hands it once the fragments in them are resolved
 */
/** What getQuery makes of a fragment once it is resolved, keyed by what each case pins down */
type ResolvedFragmentCase = {
	name: string;
	selections: SelectionNode[];
	fragments: Record<string, FragmentDefinitionNode>;
	expected: { fields?: string[]; alias?: Record<string, string>; deep?: Record<string, unknown> };
};

const resolvedFragmentCases: ResolvedFragmentCase[] = [
	{
		// The intent of #26920: a named fragment on an m2a member has to keep naming its collection
		name: 'named fragment on an m2a member scopes fields to that collection',
		selections: contentItem([buildFragmentSpread('Text')]),
		fragments: { Text: buildFragmentDefinition('Text', 'ComponentText', [buildField('text')]) },
		expected: { fields: ['contents.item:ComponentText.text'] },
	},
	{
		name: 'fragment on the m2a union type scopes fields to the member collection',
		selections: contentItem([buildFragmentSpread('AnyBlock')]),
		fragments: {
			AnyBlock: buildFragmentDefinition('AnyBlock', 'page_content_item_union', [
				buildInlineFragment('ComponentText', [buildField('text')]),
			]),
		},
		expected: { fields: ['contents.item:ComponentText.text'] },
	},
	{
		name: 'scalar fields inside a fragment are read as fields of the collection',
		selections: [buildFragmentSpread('Fields')],
		fragments: { Fields: buildFragmentDefinition('Fields', 'Page', [buildField('id'), buildField('title')]) },
		expected: { fields: ['id', 'title'] },
	},
	{
		name: 'a relational selection inside a fragment becomes a nested field path',
		selections: [buildFragmentSpread('Fields')],
		fragments: {
			Fields: buildFragmentDefinition('Fields', 'Page', [buildField('contents', { children: [buildField('id')] })]),
		},
		expected: { fields: ['contents.id'] },
	},
	{
		name: 'alias on a relational field inside a fragment is registered',
		selections: [buildFragmentSpread('Fields')],
		fragments: {
			Fields: buildFragmentDefinition('Fields', 'Page', [
				buildField('contents', { alias: 'blocks', children: [buildField('id')] }),
			]),
		},
		expected: { fields: ['blocks.id'], alias: { blocks: 'contents' } },
	},
	{
		name: 'arguments on a relational field inside a fragment reach the deep query',
		selections: [buildFragmentSpread('Fields')],
		fragments: {
			Fields: buildFragmentDefinition('Fields', 'Page', [
				buildField('contents', { args: [buildArgument('limit', 1)], children: [buildField('id')] }),
			]),
		},
		expected: { fields: ['contents.id'], deep: { contents: { _limit: 1 } } },
	},
	{
		name: 'the same fragment spread twice does not repeat its fields',
		selections: [buildFragmentSpread('Fields'), buildFragmentSpread('Fields')],
		fragments: { Fields: buildFragmentDefinition('Fields', 'Page', [buildField('title')]) },
		expected: { fields: ['title'] },
	},
	{
		name: 'fragment inside a function selection set keeps the function',
		selections: [buildField('contents_func', { children: [buildFragmentSpread('Counted')] })],
		fragments: { Counted: buildFragmentDefinition('Counted', 'count_functions', [buildField('count')]) },
		expected: { fields: ['count(contents)'] },
	},
];

describe('parseFields with resolved fragments', () => {
	test.each(resolvedFragmentCases)('$name', async ({ selections, fragments, expected }) => {
		const query = await getQuery(
			{},
			pageM2ASchema,
			resolvedSelections(selections, fragments),
			mockVariableValues,
			mockAccountability,
			'Page',
		);

		if (expected.fields) expect(query.fields).toEqual(expected.fields);
		if (expected.alias) expect(query.alias).toEqual(expected.alias);
		if (expected.deep) expect(query.deep).toEqual(expected.deep);
	});
});

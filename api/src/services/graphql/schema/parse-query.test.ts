import type { SelectionNode } from 'graphql';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { sanitizeQuery } from '../../../utils/sanitize-query.js';
import { getQuery } from './parse-query.js';

// AST node helpers
const field = (name: string, opts?: { alias?: string; args?: any[]; children?: any[] }) =>
	({
		kind: 'Field',
		name: { value: name },
		...(opts?.alias && { alias: { value: opts.alias } }),
		...(opts?.args && { arguments: opts.args }),
		...(opts?.children && { selectionSet: { selections: opts.children } }),
	}) as unknown as SelectionNode;

const inlineFragment = (type: string, children: any[]) =>
	({
		kind: 'InlineFragment',
		typeCondition: { name: { value: type } },
		selectionSet: { selections: children },
	}) as unknown as SelectionNode;

const gqlFilterArg = (filter: Record<string, any>): any => {
	const toObjectValue = (obj: Record<string, any>): any => ({
		kind: 'ObjectValue',
		fields: Object.entries(obj).map(([key, val]) => ({
			kind: 'ObjectField',
			name: { value: key },
			value: typeof val === 'object' ? toObjectValue(val) : { kind: 'StringValue', value: val },
		})),
	});

	return { name: { value: 'filter' }, value: toObjectValue(filter) };
};

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

describe('parseFields', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('should parse simple field selection', async () => {
		const selections = [field('id'), field('name')];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['id', 'name']);
	});

	test('should ignore __typename fields', async () => {
		const selections = [field('__typename'), field('title')];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['title']);
	});

	test('should parse field with alias', async () => {
		const selections = [field('author', { alias: 'writer' })];
		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['author']);
		expect(query.alias).toEqual({ writer: 'author' });
	});

	test('should parse M2A InlineFragment with schema relations', async () => {
		const selections = [field('parent', { children: [inlineFragment('child', [field('id')])] })];

		const query = await getQuery({}, m2aSchema, selections, mockVariableValues, mockAccountability, 'test_collection');
		expect(query.fields).toEqual(['parent:child.id']);
	});

	test('should inline non-M2A InlineFragment without type prefix', async () => {
		// Page { ...PageFragment } at root level, not M2A
		const selections = [inlineFragment('Page', [field('id'), field('title')])];

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

		const selections = [field('author', { children: [inlineFragment('author', [field('name'), field('email')])] })];

		const query = await getQuery({}, o2mSchema, selections, mockVariableValues, mockAccountability, 'Page');
		expect(query.fields).toEqual(['author.name', 'author.email']);
	});

	test('should parse nested selectionSet', async () => {
		const selections = [field('user', { children: [field('id'), field('email')] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['user.id', 'user.email']);
	});

	test('should parse field with arguments', async () => {
		const limitArg = { name: { value: 'limit' }, value: { kind: 'IntValue', value: '10' } };
		const selections = [field('posts', { args: [limitArg] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['posts']);
	});

	test('should parse M2A InlineFragment with arguments', async () => {
		const limitArg = { name: { value: 'limit' }, value: { kind: 'IntValue', value: '10' } };

		const selections = [
			field('parent', {
				children: [inlineFragment('child', [field('grandchild', { args: [limitArg] })])],
			}),
		];

		vi.mocked(sanitizeQuery).mockResolvedValue({ limit: 10 });

		const query = await getQuery({}, m2aSchema, selections, mockVariableValues, mockAccountability, 'test_collection');
		expect(query.fields).toEqual(['parent:child.grandchild']);

		expect(query.deep).toStrictEqual({
			parent__child: {
				grandchild: {
					_alias: {},
					_deep: {},
					_limit: 10,
				},
			},
		});
	});

	test('should parse _func field with selectionSet', async () => {
		const selections = [field('count_func', { children: [field('sum'), field('avg')] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['sum(count)', 'avg(count)']);
	});

	test('should handle empty selections', async () => {
		const query = await getQuery({}, mockSchema, [], mockVariableValues, mockAccountability);
		expect(query.fields).toEqual([]);
	});

	test('M2A InlineFragment with full relation chain produces correct paths', async () => {
		// contents → item → InlineFragment(ComponentText) with translation filter
		const filterArg = gqlFilterArg({ languages_code: { code: { _eq: 'en-EN' } } });

		const selections = [
			field('contents', {
				children: [
					field('item', {
						children: [
							inlineFragment('ComponentText', [
								field('id'),
								field('translations', { args: [filterArg], children: [field('id')] }),
							]),
						],
					}),
				],
			}),
		];

		vi.mocked(sanitizeQuery).mockResolvedValue({
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
		const selections = [field('parent', { children: [field('child', { children: [field('grandchild')] })] })];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['parent.child.grandchild']);
	});
});

import type { FieldNode, SelectionNode } from 'graphql';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { sanitizeQuery } from '../../../utils/sanitize-query.js';
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

describe('parseFields', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('should parse simple field selection', async () => {
		const selections = [
			{ kind: 'Field', name: { value: 'id' } },
			{ kind: 'Field', name: { value: 'name' } },
		] as SelectionNode[];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['id', 'name']);
	});

	test('should ignore __typename fields', async () => {
		const selections = [
			{ kind: 'Field', name: { value: '__typename' } },
			{ kind: 'Field', name: { value: 'title' } },
		] as SelectionNode[];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['title']);
	});

	test('should parse field with alias', async () => {
		const selections = [{ kind: 'Field', name: { value: 'author' }, alias: { value: 'writer' } }] as SelectionNode[];
		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['author']);
		expect(query.alias).toEqual({ writer: 'author' });
	});

	test('should parse M2A InlineFragment with schema relations', async () => {
		const selections = [
			{
				kind: 'Field',
				name: { value: 'parent' },
				selectionSet: {
					selections: [
						{
							kind: 'InlineFragment',
							typeCondition: { name: { value: 'child' } },
							selectionSet: {
								selections: [{ kind: 'Field', name: { value: 'id' } }],
							},
						},
					],
				},
			},
		] as unknown as SelectionNode[];

		const query = await getQuery({}, m2aSchema, selections, mockVariableValues, mockAccountability, 'test_collection');
		expect(query.fields).toEqual(['parent:child.id']);
	});

	test('should inline non-M2A InlineFragment without type prefix', async () => {
		// Page { ...PageFragment } at root level, not M2A
		const selections = [
			{
				kind: 'InlineFragment',
				typeCondition: { name: { value: 'Page' } },
				selectionSet: {
					selections: [
						{ kind: 'Field', name: { value: 'id' } },
						{ kind: 'Field', name: { value: 'title' } },
					],
				},
			},
		] as unknown as SelectionNode[];

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
					meta: {
						one_field: 'author',
						one_collection_field: null,
						one_allowed_collections: null,
					},
				},
			],
		} as any;

		const selections = [
			{
				kind: 'Field',
				name: { value: 'author' },
				selectionSet: {
					selections: [
						{
							kind: 'InlineFragment',
							typeCondition: { name: { value: 'author' } },
							selectionSet: {
								selections: [
									{ kind: 'Field', name: { value: 'name' } },
									{ kind: 'Field', name: { value: 'email' } },
								],
							},
						},
					],
				},
			},
		] as unknown as SelectionNode[];

		const query = await getQuery({}, o2mSchema, selections, mockVariableValues, mockAccountability, 'Page');
		expect(query.fields).toEqual(['author.name', 'author.email']);
	});

	test('should parse nested selectionSet', async () => {
		const selections = [
			{
				kind: 'Field',
				name: { value: 'user' },
				selectionSet: {
					selections: [
						{ kind: 'Field', name: { value: 'id' } },
						{ kind: 'Field', name: { value: 'email' } },
					],
				},
			},
		] as unknown as SelectionNode[];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['user.id', 'user.email']);
	});

	test('should parse field with arguments', async () => {
		const selections = [
			{
				kind: 'Field',
				name: { value: 'posts' },
				arguments: [{ name: { value: 'limit' }, value: { kind: 'IntValue', value: '10' } }],
			},
		] as unknown as FieldNode[];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['posts']);
	});

	test('should parse M2A InlineFragment with arguments', async () => {
		const selections = [
			{
				kind: 'Field',
				name: { value: 'parent' },
				selectionSet: {
					selections: [
						{
							kind: 'InlineFragment',
							typeCondition: { name: { value: 'child' } },
							selectionSet: {
								selections: [
									{
										kind: 'Field',
										name: { value: 'grandchild' },
										arguments: [{ name: { value: 'limit' }, value: { kind: 'IntValue', value: '10' } }],
									},
								],
							},
						},
					],
				},
			},
		] as unknown as SelectionNode[];

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
		const selections = [
			{
				kind: 'Field',
				name: { value: 'count_func' },
				selectionSet: {
					selections: [
						{ kind: 'Field', name: { value: 'sum' } },
						{ kind: 'Field', name: { value: 'avg' } },
					],
				},
			},
		] as unknown as SelectionNode[];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['sum(count)', 'avg(count)']);
	});

	test('should handle empty selections', async () => {
		const query = await getQuery({}, mockSchema, [], mockVariableValues, mockAccountability);
		expect(query.fields).toEqual([]);
	});

	test('M2A InlineFragment with full relation chain produces correct paths', async () => {
		// contents → item → InlineFragment(ComponentText) with translation filter
		const selections = [
			{
				kind: 'Field',
				name: { value: 'contents' },
				selectionSet: {
					selections: [
						{
							kind: 'Field',
							name: { value: 'item' },
							selectionSet: {
								selections: [
									{
										kind: 'InlineFragment',
										typeCondition: { name: { value: 'ComponentText' } },
										selectionSet: {
											selections: [
												{ kind: 'Field', name: { value: 'id' } },
												{
													kind: 'Field',
													name: { value: 'translations' },
													arguments: [
														{
															name: { value: 'filter' },
															value: {
																kind: 'ObjectValue',
																fields: [
																	{
																		kind: 'ObjectField',
																		name: { value: 'languages_code' },
																		value: {
																			kind: 'ObjectValue',
																			fields: [
																				{
																					kind: 'ObjectField',
																					name: { value: 'code' },
																					value: {
																						kind: 'ObjectValue',
																						fields: [
																							{
																								kind: 'ObjectField',
																								name: { value: '_eq' },
																								value: { kind: 'StringValue', value: 'en-EN' },
																							},
																						],
																					},
																				},
																			],
																		},
																	},
																],
															},
														},
													],
													selectionSet: {
														selections: [{ kind: 'Field', name: { value: 'id' } }],
													},
												},
											],
										},
									},
								],
							},
						},
					],
				},
			},
		] as unknown as SelectionNode[];

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
		const selections = [
			{
				kind: 'Field',
				name: { value: 'parent' },
				selectionSet: {
					selections: [
						{
							kind: 'Field',
							name: { value: 'child' },
							selectionSet: {
								selections: [{ kind: 'Field', name: { value: 'grandchild' } }],
							},
						},
					],
				},
			},
		] as unknown as SelectionNode[];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
		expect(query.fields).toEqual(['parent.child.grandchild']);
	});
});

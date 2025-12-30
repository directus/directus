import { getQuery } from './parse-query.js';
import { sanitizeQuery } from '../../../utils/sanitize-query.js';
import type { FieldNode, SelectionNode } from 'graphql';
import { afterEach, describe, expect, test, vi } from 'vitest';

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

const mockSchema = {} as any;
const mockAccountability = null;
const mockVariableValues = {};

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

	test('should parse InlineFragment', async () => {
		const selections = [
			{
				kind: 'Field',
				name: { value: 'parent' },
				selectionSet: { selections: [{ kind: 'InlineFragment', typeCondition: { name: { value: 'child' } } }] },
			},
		] as unknown as SelectionNode[];

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability, 'test_collection');
		expect(query.fields).toContain('parent:child');
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

	test('should parse InlineFragment with arguments', async () => {
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

		const query = await getQuery({}, mockSchema, selections, mockVariableValues, mockAccountability);
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

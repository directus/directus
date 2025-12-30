import { injectCases } from './inject-cases.js';
import type { AST } from '../../../../types/ast.js';
import { getUnaliasedFieldKey } from '../../../utils/get-unaliased-field-key.js';
import type { DeepPartial, Permission } from '@directus/types';
import { beforeAll, expect, test, vi } from 'vitest';

vi.mock('../../../utils/get-unaliased-field-key.js');

beforeAll(() => {
	vi.clearAllMocks();

	// This just returns the field key, normally the ast would be of a proper type and getUnaliasedFieldKey would work
	vi.mocked(getUnaliasedFieldKey).mockImplementation((field) => field.fieldKey);
});

test('Injects cases related to ast', () => {
	const ast: DeepPartial<AST> = {
		name: 'test-collection-a',
		cases: [],
		children: [{ fieldKey: 'test-field-a' }],
	};

	const permissions: DeepPartial<Permission>[] = [
		{ collection: 'test-collection-a', permissions: { status: { _eq: 'published' } }, fields: ['test-field-a'] },
		{ collection: 'test-collection-b', permissions: null, fields: [] },
	];

	injectCases(ast as AST, permissions as Permission[]);

	expect(ast.cases).toEqual([{ status: { _eq: 'published' } }]);
});

test('Ignores cases for fields that are not requested', () => {
	const ast: DeepPartial<AST> = {
		name: 'test-collection-a',
		cases: [],
		children: [{ fieldKey: 'test-field-a' }],
	};

	const permissions: DeepPartial<Permission>[] = [
		{ collection: 'test-collection-a', permissions: { status: { _eq: 'published' } }, fields: ['test-field-a'] },
		{ collection: 'test-collection-a', permissions: null, fields: ['not-requested-field'] },
	];

	injectCases(ast as AST, permissions as Permission[]);

	expect(ast.cases).toEqual([{ status: { _eq: 'published' } }]);
});

test('Adds cases that apply to fields in ast children', () => {
	const ast: DeepPartial<AST> = {
		name: 'test-collection-a',
		cases: [],
		children: [
			{ fieldKey: 'test-field-a', whenCase: [] },
			{ fieldKey: 'test-field-b', whenCase: [] },
			{ fieldKey: 'test-field-c', whenCase: [] },
		],
	};

	const permissions: DeepPartial<Permission>[] = [
		{
			collection: 'test-collection-a',
			permissions: { status: { _eq: 'published' } },
			fields: ['test-field-a', 'test-field-b'],
		},
		{
			collection: 'test-collection-a',
			permissions: { status: { _eq: 'draft' } },
			fields: ['test-field-b', 'test-field-c'],
		},
	];

	injectCases(ast as AST, permissions as Permission[]);

	expect(ast.children).toEqual([
		{
			fieldKey: 'test-field-a',
			whenCase: [0],
		},
		{
			fieldKey: 'test-field-b',
			whenCase: [0, 1],
		},
		{
			fieldKey: 'test-field-c',
			whenCase: [1],
		},
	]);
});

test('Ignores cases for fields that are allowed by "all" permissions', () => {
	const ast: DeepPartial<AST> = {
		name: 'test-collection-a',
		cases: [],
		children: [{ fieldKey: 'test-field-a', whenCase: [] }],
	};

	const permissions: DeepPartial<Permission>[] = [
		{ collection: 'test-collection-a', permissions: { status: { _eq: 'published' } }, fields: ['test-field-a'] },

		// This permission says you can always get field-a no matter what, so the permission above should be ignored
		{ collection: 'test-collection-a', permissions: {}, fields: ['test-field-a'] },
	];

	injectCases(ast as AST, permissions as Permission[]);

	expect(ast.children).toEqual([
		{
			fieldKey: 'test-field-a',
			whenCase: [], // empty as there's a "all" permission
		},
	]);
});

// In real life usage, the inject function is called after the AST has already been validated for
// access, so this error should never be thrown in production use
test('Errors out when there are no permissions for the requested fields', () => {
	const ast: DeepPartial<AST> = {
		name: 'test-collection-a',
		cases: [],
		children: [{ fieldKey: 'test-field-a', whenCase: [] }],
	};

	const permissions: DeepPartial<Permission>[] = [
		{ collection: 'test-collection-a', permissions: { status: { _eq: 'published' } }, fields: ['test-field-b'] },
	];

	expect(() => injectCases(ast as AST, permissions as Permission[])).toThrow();
});

test('Adds the cases to each field if affected fields is *', () => {
	const ast: DeepPartial<AST> = {
		name: 'test-collection-a',
		cases: [],
		children: [
			{ fieldKey: 'test-field-a', whenCase: [] },
			{ fieldKey: 'test-field-b', whenCase: [] },
			{ fieldKey: 'test-field-c', whenCase: [] },
		],
	};

	const permissions: DeepPartial<Permission>[] = [
		{
			collection: 'test-collection-a',
			permissions: { status: { _eq: 'published' } },
			fields: ['*'],
		},
		{
			collection: 'test-collection-a',
			permissions: { status: { _eq: 'draft' } },
			fields: ['test-field-b', 'test-field-c'],
		},
	];

	injectCases(ast as AST, permissions as Permission[]);

	expect(ast.children).toEqual([
		{
			fieldKey: 'test-field-a',
			whenCase: [0],
		},
		{
			fieldKey: 'test-field-b',
			whenCase: [0, 1],
		},
		{
			fieldKey: 'test-field-c',
			whenCase: [0, 1],
		},
	]);
});

test('Processes m2o children recursively', () => {
	const ast: DeepPartial<AST> = {
		name: 'test-collection-a',
		cases: [],
		children: [
			{ fieldKey: 'test-field-a', whenCase: [] },
			{
				type: 'm2o',
				fieldKey: 'test-field-b',
				relation: { related_collection: 'test-collection-b' },
				children: [
					{ fieldKey: 'test-field-related-a', whenCase: [] },
					{ fieldKey: 'test-field-related-b', whenCase: [] },
				],
			},
		],
	};

	const permissions: DeepPartial<Permission>[] = [
		{
			collection: 'test-collection-a',
			permissions: { status: { _eq: 'published' } },
			fields: ['*'],
		},
		{
			collection: 'test-collection-b',
			permissions: { status: { _eq: 'draft' } },
			fields: ['test-field-related-a'],
		},
		{
			collection: 'test-collection-b',
			permissions: { status: { _eq: 'under-review' } },
			fields: ['test-field-related-b'],
		},
	];

	injectCases(ast as AST, permissions as Permission[]);

	expect(ast.children).toEqual([
		{ fieldKey: 'test-field-a', whenCase: [0] },
		{
			type: 'm2o',
			fieldKey: 'test-field-b',
			relation: { related_collection: 'test-collection-b' },
			cases: [{ status: { _eq: 'draft' } }, { status: { _eq: 'under-review' } }],
			whenCase: [0],
			children: [
				{ fieldKey: 'test-field-related-a', whenCase: [0] },
				{ fieldKey: 'test-field-related-b', whenCase: [1] },
			],
		},
	]);
});

test('Processes o2m children recursively', () => {
	const ast: DeepPartial<AST> = {
		name: 'test-collection-a',
		cases: [],
		children: [
			{ fieldKey: 'test-field-a', whenCase: [] },
			{
				type: 'o2m',
				fieldKey: 'test-field-b',
				relation: { collection: 'test-collection-b' },
				children: [
					{ fieldKey: 'test-field-related-a', whenCase: [] },
					{ fieldKey: 'test-field-related-b', whenCase: [] },
				],
			},
		],
	};

	const permissions: DeepPartial<Permission>[] = [
		{
			collection: 'test-collection-a',
			permissions: { status: { _eq: 'published' } },
			fields: ['*'],
		},
		{
			collection: 'test-collection-b',
			permissions: { status: { _eq: 'draft' } },
			fields: ['test-field-related-a'],
		},
		{
			collection: 'test-collection-b',
			permissions: { status: { _eq: 'under-review' } },
			fields: ['test-field-related-b'],
		},
	];

	injectCases(ast as AST, permissions as Permission[]);

	expect(ast.children).toEqual([
		{ fieldKey: 'test-field-a', whenCase: [0] },
		{
			type: 'o2m',
			fieldKey: 'test-field-b',
			relation: { collection: 'test-collection-b' },
			cases: [{ status: { _eq: 'draft' } }, { status: { _eq: 'under-review' } }],
			whenCase: [0],
			children: [
				{ fieldKey: 'test-field-related-a', whenCase: [0] },
				{ fieldKey: 'test-field-related-b', whenCase: [1] },
			],
		},
	]);
});

test('Processes a2o children recursively', () => {
	const ast: DeepPartial<AST> = {
		name: 'test-collection-a',
		cases: [],
		children: [
			{ fieldKey: 'test-field-a', whenCase: [] },
			{
				type: 'a2o',
				fieldKey: 'test-field-b',
				names: ['test-collection-b', 'test-collection-c'],
				cases: {},
				children: {
					'test-collection-b': [
						{ fieldKey: 'test-field-related-a', whenCase: [] },
						{ fieldKey: 'test-field-related-b', whenCase: [] },
					],
					'test-collection-c': [],
				},
			},
		],
	};

	const permissions: DeepPartial<Permission>[] = [
		{
			collection: 'test-collection-a',
			permissions: { status: { _eq: 'published' } },
			fields: ['*'],
		},
		{
			collection: 'test-collection-b',
			permissions: { status: { _eq: 'draft' } },
			fields: ['test-field-related-a'],
		},
		{
			collection: 'test-collection-b',
			permissions: { status: { _eq: 'under-review' } },
			fields: ['test-field-related-b'],
		},
		{
			collection: 'test-collection-c',
			permissions: {},
			fields: ['*'],
		},
	];

	injectCases(ast as AST, permissions as Permission[]);

	expect(ast.children).toEqual([
		{ fieldKey: 'test-field-a', whenCase: [0] },
		{
			type: 'a2o',
			fieldKey: 'test-field-b',
			names: ['test-collection-b', 'test-collection-c'],
			cases: {
				'test-collection-b': [{ status: { _eq: 'draft' } }, { status: { _eq: 'under-review' } }],
				'test-collection-c': [{}],
			},
			whenCase: [0],
			children: {
				'test-collection-b': [
					{ fieldKey: 'test-field-related-a', whenCase: [0] },
					{ fieldKey: 'test-field-related-b', whenCase: [1] },
				],
				'test-collection-c': [],
			},
		},
	]);
});

import type { DeepPartial, Permission } from '@directus/types';
import { expect, test } from 'vitest';
import type { AST } from '../../../types/ast.js';
import { injectCases } from './inject-cases.js';

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

})

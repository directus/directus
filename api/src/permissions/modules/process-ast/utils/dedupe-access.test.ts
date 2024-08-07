import type { DeepPartial, Permission } from '@directus/types';
import { expect, test } from 'vitest';
import { dedupeAccess } from './dedupe-access.js';

test('Merges field sets where access rules are identical', () => {
	const input: DeepPartial<Permission>[] = [
		{
			permissions: {},
			fields: ['test-field-a', 'test-field-b'],
		},
		{
			permissions: {},
			fields: ['test-field-b', 'test-field-c'],
		},
		{
			permissions: { status: { _eq: 'published' } },
			fields: ['test-field-excluded'],
		},
	];

	const output = dedupeAccess(input as Permission[]);

	expect(output).toEqual([
		{
			rule: {},
			fields: new Set(['test-field-a', 'test-field-b', 'test-field-c']),
		},
		{
			rule: { status: { _eq: 'published' } },
			fields: new Set(['test-field-excluded']),
		},
	]);
});

test('Treats null and {} as {}', () => {
	const input: DeepPartial<Permission>[] = [
		{
			permissions: null,
			fields: ['test-field-a', 'test-field-b'],
		},
		{
			permissions: {},
			fields: ['test-field-b', 'test-field-c'],
		},
		{
			permissions: { status: { _eq: 'published' } },
			fields: ['test-field-excluded'],
		},
	];

	const output = dedupeAccess(input as Permission[]);

	expect(output).toEqual([
		{
			rule: {},
			fields: new Set(['test-field-a', 'test-field-b', 'test-field-c']),
		},
		{
			rule: { status: { _eq: 'published' } },
			fields: new Set(['test-field-excluded']),
		},
	]);
});

test('Merges rules where rule is identical but ordered differently', () => {
	const input: DeepPartial<Permission>[] = [
		{
			permissions: { _and: [{ a: { _eq: 1 } }, { b: { _eq: 2 } }] },
			fields: ['test-field-a', 'test-field-b'],
		},
		{
			permissions: { _and: [{ b: { _eq: 2 } }, { a: { _eq: 1 } }] },
			fields: ['test-field-b', 'test-field-c'],
		},
	];

	const output = dedupeAccess(input as Permission[]);

	expect(output).toEqual([
		{
			rule: { _and: [{ a: { _eq: 1 } }, { b: { _eq: 2 } }] },
			fields: new Set(['test-field-a', 'test-field-b', 'test-field-c']),
		},
	]);
});

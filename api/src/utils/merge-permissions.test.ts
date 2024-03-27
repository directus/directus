import type { Filter, Permission } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { mergePermission } from './merge-permissions.js';

const fullFilter = {} as Filter;
const conditionalFilter = { user: { id: { _eq: '$CURRENT_USER' } } } as Filter;
const conditionalFilter2 = { count: { _gt: 42 } } as Filter;

const permissionTemplate = {
	role: null,
	collection: 'directus_users',
	permissions: null,
	validation: null,
	presets: null,
	fields: null,
} as Permission;

describe('merging permissions', () => {
	test('processes _or permissions', () => {
		const mergedPermission = mergePermission(
			'or',
			{ ...permissionTemplate, permissions: conditionalFilter },
			{ ...permissionTemplate, permissions: conditionalFilter2 },
		);

		expect(mergedPermission).toStrictEqual({
			...permissionTemplate,
			permissions: {
				_or: [conditionalFilter, conditionalFilter2],
			},
		});
	});

	test('processes _or validations', () => {
		const mergedPermission = mergePermission(
			'or',
			{ ...permissionTemplate, validation: conditionalFilter },
			{ ...permissionTemplate, validation: conditionalFilter2 },
		);

		expect(mergedPermission).toStrictEqual({
			...permissionTemplate,
			validation: {
				_or: [conditionalFilter, conditionalFilter2],
			},
		});
	});

	test('processes _and permissions', () => {
		const mergedPermission = mergePermission(
			'and',
			{ ...permissionTemplate, permissions: conditionalFilter },
			{ ...permissionTemplate, permissions: conditionalFilter2 },
		);

		expect(mergedPermission).toStrictEqual({
			...permissionTemplate,
			permissions: {
				_and: [conditionalFilter, conditionalFilter2],
			},
		});
	});

	test('processes _and validations', () => {
		const mergedPermission = mergePermission(
			'and',
			{ ...permissionTemplate, validation: conditionalFilter },
			{ ...permissionTemplate, validation: conditionalFilter2 },
		);

		expect(mergedPermission).toStrictEqual({
			...permissionTemplate,
			validation: {
				_and: [conditionalFilter, conditionalFilter2],
			},
		});
	});

	test('{} supersedes conditional permissions in _or', () => {
		const mergedPermission = mergePermission(
			'or',
			{ ...permissionTemplate, permissions: fullFilter },
			{ ...permissionTemplate, permissions: conditionalFilter },
		);

		expect(mergedPermission).toStrictEqual({ ...permissionTemplate, permissions: fullFilter });
	});

	test('{} supersedes conditional validations in _or', () => {
		const mergedPermission = mergePermission(
			'or',
			{ ...permissionTemplate, validation: fullFilter },
			{ ...permissionTemplate, validation: conditionalFilter },
		);

		expect(mergedPermission).toStrictEqual({ ...permissionTemplate, validation: fullFilter });
	});

	test('{} does not supersede conditional permissions in _and', () => {
		const mergedPermission = mergePermission(
			'and',
			{ ...permissionTemplate, permissions: fullFilter },
			{ ...permissionTemplate, permissions: conditionalFilter },
		);

		const expectedPermission = {
			...permissionTemplate,
			permissions: {
				_and: [fullFilter, conditionalFilter],
			},
		};

		expect(mergedPermission).toStrictEqual(expectedPermission);
	});

	test('{} does not supersede conditional validations in _and', () => {
		const mergedPermission = mergePermission(
			'and',
			{ ...permissionTemplate, validation: fullFilter },
			{ ...permissionTemplate, validation: conditionalFilter },
		);

		const expectedPermission = {
			...permissionTemplate,
			validation: {
				_and: [fullFilter, conditionalFilter],
			},
		};

		expect(mergedPermission).toStrictEqual(expectedPermission);
	});
});

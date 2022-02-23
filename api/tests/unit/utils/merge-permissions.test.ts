import { mergePermission } from '../../../src/utils/merge-permissions';
import { Permission, Filter } from '@directus/shared/types';

const fullFilter = {} as Filter;
const conditionalFilter = { user: { id: { _eq: '$CURRENT_USER' } } } as Filter;

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
			{ ...permissionTemplate, permissions: conditionalFilter }
		);
		expect(mergedPermission).toStrictEqual({
			...permissionTemplate,
			permissions: {
				_or: [conditionalFilter, conditionalFilter],
			},
		});
	});

	test('processes _or validations', () => {
		const mergedPermission = mergePermission(
			'or',
			{ ...permissionTemplate, validation: conditionalFilter },
			{ ...permissionTemplate, validation: conditionalFilter }
		);
		expect(mergedPermission).toStrictEqual({
			...permissionTemplate,
			validation: {
				_or: [conditionalFilter, conditionalFilter],
			},
		});
	});

	test('processes _and permissions', () => {
		const mergedPermission = mergePermission(
			'and',
			{ ...permissionTemplate, permissions: conditionalFilter },
			{ ...permissionTemplate, permissions: conditionalFilter }
		);
		expect(mergedPermission).toStrictEqual({
			...permissionTemplate,
			permissions: {
				_and: [conditionalFilter, conditionalFilter],
			},
		});
	});

	test('processes _and validations', () => {
		const mergedPermission = mergePermission(
			'and',
			{ ...permissionTemplate, validation: conditionalFilter },
			{ ...permissionTemplate, validation: conditionalFilter }
		);
		expect(mergedPermission).toStrictEqual({
			...permissionTemplate,
			validation: {
				_and: [conditionalFilter, conditionalFilter],
			},
		});
	});

	test('{} supercedes conditional permissions in _or', () => {
		const mergedPermission = mergePermission(
			'or',
			{ ...permissionTemplate, permissions: fullFilter },
			{ ...permissionTemplate, permissions: conditionalFilter }
		);
		expect(mergedPermission).toStrictEqual({ ...permissionTemplate, permissions: fullFilter });
	});

	test('{} supercedes conditional validations in _or', () => {
		const mergedPermission = mergePermission(
			'or',
			{ ...permissionTemplate, validation: fullFilter },
			{ ...permissionTemplate, validation: conditionalFilter }
		);
		expect(mergedPermission).toStrictEqual({ ...permissionTemplate, validation: fullFilter });
	});

	test('{} does not supercede conditional permissions in _and', () => {
		const mergedPermission = mergePermission(
			'and',
			{ ...permissionTemplate, permissions: fullFilter },
			{ ...permissionTemplate, permissions: conditionalFilter }
		);
		const expectedPermission = {
			...permissionTemplate,
			permissions: {
				_and: [fullFilter, conditionalFilter],
			},
		};

		expect(mergedPermission).toStrictEqual(expectedPermission);
	});

	test('{} does not supercede conditional validations in _and', () => {
		const mergedPermission = mergePermission(
			'and',
			{ ...permissionTemplate, validation: fullFilter },
			{ ...permissionTemplate, validation: conditionalFilter }
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

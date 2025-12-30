import { filterItems } from './filter-items.js';
import { describe, expect, test } from 'vitest';

const items = [
	{
		role: '9bc9fea0-f761-4107-bfb7-b3d06c125e98',
		permissions: {},
		validation: null,
		presets: null,
		fields: ['*'],
		system: true,
		collection: 'directus_settings',
		action: 'read',
	},
	{
		role: '9bc9fea0-f761-4107-bfb7-b3d06c125e98',
		permissions: {
			user: {
				_eq: '$CURRENT_USER',
			},
		},
		validation: null,
		presets: null,
		fields: ['*'],
		system: true,
		collection: 'directus_presets',
		action: 'delete',
	},
];

describe('filter items', () => {
	test('return items when no filter', () => {
		const result = filterItems(items, undefined);
		expect(result).toStrictEqual(items);
	});

	test('return items when empty filter used', () => {
		const result = filterItems(items, {});
		expect(result).toStrictEqual(items);
	});

	test('return filtered items when nested empty filter used', () => {
		const result = filterItems(items, {
			_and: [
				{
					action: {
						_eq: 'read',
					},
				},
				{},
			],
		});

		expect(result).toStrictEqual(items.filter((item) => item.action === 'read'));
	});

	test('return filtered items', () => {
		const result = filterItems(items, {
			action: {
				_eq: 'read',
			},
		});

		expect(result).toStrictEqual(items.filter((item) => item.action === 'read'));
	});
});

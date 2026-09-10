import { Filter } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { filterItems } from './filter-items';

const items = [
	{ id: 1, name: 'Send email', status: 'active', description: 'Notify the team', folder: 'folder-a' },
	{ id: 2, name: 'Sync data', status: 'inactive', description: 'Nightly job', folder: 'folder-a' },
	{ id: 3, name: 'Send report', status: 'active', description: null, folder: null },
];

describe('filterItems', () => {
	test('returns everything when filter is null or empty', () => {
		expect(filterItems(items, null)).toEqual(items);
		expect(filterItems(items, {})).toEqual(items);
	});

	test('matches a simple equality leaf', () => {
		const filter: Filter = { status: { _eq: 'active' } };
		expect(filterItems(items, filter).map((i) => i.id)).toEqual([1, 3]);
	});

	test('matches a substring leaf', () => {
		const filter: Filter = { name: { _contains: 'Send' } };
		expect(filterItems(items, filter).map((i) => i.id)).toEqual([1, 3]);
	});

	test('combines leaves with _and', () => {
		const filter: Filter = { _and: [{ status: { _eq: 'active' } }, { name: { _contains: 'report' } }] };
		expect(filterItems(items, filter).map((i) => i.id)).toEqual([3]);
	});

	test('combines leaves with _or', () => {
		const filter: Filter = { _or: [{ status: { _eq: 'inactive' } }, { name: { _contains: 'report' } }] };
		expect(filterItems(items, filter).map((i) => i.id)).toEqual([2, 3]);
	});

	test('matches a relational path when the item carries the related object', () => {
		const hydrated = items.map((item) => ({
			...item,
			folder: item.folder === 'folder-a' ? { id: 'folder-a', name: 'Notifications', parent: null } : null,
		}));

		const filter: Filter = { folder: { name: { _eq: 'Notifications' } } };
		expect(filterItems(hydrated, filter).map((i) => i.id)).toEqual([1, 2]);
	});

	test('excludes items for a relational path that only holds a foreign key', () => {
		const filter: Filter = { folder: { name: { _eq: 'anything' } } };
		expect(filterItems(items, filter)).toEqual([]);
	});
});

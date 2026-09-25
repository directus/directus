import { describe, expect, it } from 'vitest';
import type { DataCollection } from './data-store.js';
import { partitionCollections } from './system-collections.js';

function content(collection: string): DataCollection {
	return { collection, primaryKey: 'id', records: [] };
}

describe('partitionCollections', () => {
	it('orders system collections dependencies-first and codepoint-sorts content after them', () => {
		const { system, content: contentOut } = partitionCollections([
			content('zebra'),
			content('directus_roles'),
			content('apple'),
			content('directus_access'),
			content('directus_policies'),
		]);

		expect(system.map((entry) => entry.data.collection)).toEqual([
			'directus_access',
			'directus_policies',
			'directus_roles',
		]);

		expect(contentOut.map((entry) => entry.collection)).toEqual(['apple', 'zebra']);
	});

	it('keeps a system collection without a natural key (directus_panels) in the system partition', () => {
		const { system, content: contentOut } = partitionCollections([content('directus_panels'), content('notes')]);

		expect(system.map((entry) => entry.data.collection)).toEqual(['directus_panels']);
		expect(contentOut.map((entry) => entry.collection)).toEqual(['notes']);
	});
});

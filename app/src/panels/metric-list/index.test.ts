import { afterEach, describe, expect, it, vi } from 'vitest';
import panel from './index';

const mockGetCollection = vi.hoisted(() => vi.fn(() => ({ meta: { singleton: false } })));
const mockGetRelationForField = vi.hoisted(() => vi.fn(() => null as any));
const mockGetPrimaryKeyFieldForCollection = vi.hoisted(() => vi.fn(() => ({ field: 'id' })));
const mockGetFieldsForCollection = vi.hoisted(() => vi.fn(() => [] as any[]));

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: () => ({
		getCollection: mockGetCollection,
	}),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getField: vi.fn(() => null),
		getPrimaryKeyFieldForCollection: mockGetPrimaryKeyFieldForCollection,
		getFieldsForCollection: mockGetFieldsForCollection,
	}),
}));

vi.mock('@/stores/relations', () => ({
	useRelationsStore: () => ({
		getRelationForField: mockGetRelationForField,
	}),
}));

afterEach(() => {
	vi.clearAllMocks();
});

const baseOptions = {
	collection: 'posts',
	groupByField: 'author',
	aggregateField: 'views',
	aggregateFunction: 'sum',
	sortDirection: 'desc',
	limit: 5,
};

describe('metric-list panel query', () => {
	it('returns undefined when there is no collection', () => {
		expect(panel.query!({})).toBeUndefined();
	});

	it('returns a single query when no display field is configured', () => {
		const result = panel.query!(baseOptions);

		expect(Array.isArray(result)).toBe(false);

		expect(result).toMatchObject({
			collection: 'posts',
			query: { group: ['author'], aggregate: { sum: ['views'] } },
		});
	});

	it('returns a single query when a display field is set but the group field is not relational', () => {
		mockGetRelationForField.mockReturnValue(null);

		const result = panel.query!({ ...baseOptions, groupByDisplayField: 'name' });

		expect(Array.isArray(result)).toBe(false);
	});

	it('returns a two-part query when a display field is set on a relational group field', () => {
		mockGetRelationForField.mockReturnValue({ related_collection: 'authors' });
		mockGetPrimaryKeyFieldForCollection.mockReturnValue({ field: 'id' });

		const result = panel.query!({ ...baseOptions, groupByDisplayField: 'name' });

		expect(Array.isArray(result)).toBe(true);
		const [primary, display] = result as any[];
		expect(primary.query.group).toEqual(['author']);

		expect(display).toMatchObject({
			collection: 'authors',
			query: { fields: ['id', 'name'], limit: -1 },
		});
	});
});

describe('metric-list panel options', () => {
	function getField(fields: any[], name: string) {
		return fields.find((field) => field.field === name);
	}

	it('hides the display field option when the group field is not relational', () => {
		mockGetRelationForField.mockReturnValue(null);

		const fields = panel.options!({ options: { collection: 'posts', groupByField: 'author' } }) as any[];
		const displayField = getField(fields, 'groupByDisplayField');

		expect(displayField?.meta.hidden).toBe(true);
		expect(displayField?.meta.options.choices).toEqual([]);
	});

	it('shows display field choices from the related collection when relational', () => {
		mockGetRelationForField.mockReturnValue({ related_collection: 'authors' });

		mockGetFieldsForCollection.mockReturnValue([
			{ field: 'id', name: 'ID', meta: {} },
			{ field: 'name', name: 'Name', meta: {} },
			{ field: 'hidden_alias', name: 'Hidden', meta: { special: ['alias', 'no-data'] } },
		]);

		const fields = panel.options!({ options: { collection: 'posts', groupByField: 'author' } }) as any[];
		const displayField = getField(fields, 'groupByDisplayField');

		expect(displayField?.meta.hidden).toBe(false);

		expect(displayField?.meta.options.choices).toEqual([
			{ text: 'ID', value: 'id' },
			{ text: 'Name', value: 'name' },
		]);
	});
});

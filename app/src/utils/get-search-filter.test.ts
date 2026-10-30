import type { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getSearchFilter } from './get-search-filter';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

function makeField(collection: string, field: string, type: string, meta: Partial<Field['meta']> = {}): Field {
	return {
		collection,
		field,
		name: field,
		type,
		schema: {},
		meta: { collection, field, special: null, group: null, searchable: true, ...meta },
	} as unknown as Field;
}

function makeRelation(collection: string, field: string, relatedCollection: string): Relation {
	return {
		collection,
		field,
		related_collection: relatedCollection,
		schema: null,
		meta: { many_collection: collection, many_field: field, one_collection: relatedCollection, one_field: null },
	} as unknown as Relation;
}

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));

	useFieldsStore().fields = [
		makeField('articles_tags', 'id', 'integer'),
		makeField('articles_tags', 'tags_id', 'integer'),
		makeField('tags', 'id', 'integer'),
		makeField('tags', 'name', 'string'),
		makeField('tags', 'uuid', 'uuid'),
		makeField('tags', 'secret', 'string', { special: ['conceal'] }),
		makeField('tags', 'notes', 'text', { searchable: false }),
		makeField('tags', 'metadata', 'json'),
	];

	useRelationsStore().relations = [makeRelation('articles_tags', 'tags_id', 'tags')];
});

describe('getSearchFilter', () => {
	test('should match displayed related text fields', () => {
		expect(getSearchFilter('articles_tags', ['tags_id.name'], 'Banana')).toEqual({
			_or: [{ tags_id: { name: { _icontains: 'Banana' } } }],
		});
	});

	test('should match numeric fields by equality only when the search is a number', () => {
		expect(getSearchFilter('articles_tags', ['tags_id.id', 'tags_id.name'], '2')).toEqual({
			_or: [{ tags_id: { id: { _eq: 2 } } }, { tags_id: { name: { _icontains: '2' } } }],
		});

		expect(getSearchFilter('articles_tags', ['tags_id.id', 'tags_id.name'], 'Banana')).toEqual({
			_or: [{ tags_id: { name: { _icontains: 'Banana' } } }],
		});
	});

	test('should match uuid fields by equality only when the search is a valid uuid', () => {
		const uuid = 'a95bb360-cf07-4613-bd73-8901fa275028';

		expect(getSearchFilter('articles_tags', ['tags_id.uuid'], uuid)).toEqual({
			_or: [{ tags_id: { uuid: { _eq: uuid } } }],
		});

		expect(getSearchFilter('articles_tags', ['tags_id.uuid', 'tags_id.name'], 'a95bb360')).toEqual({
			_or: [{ tags_id: { name: { _icontains: 'a95bb360' } } }],
		});
	});

	test('should skip concealed, non-searchable and unsupported fields, returning null when none are left', () => {
		expect(
			getSearchFilter('articles_tags', ['tags_id.secret', 'tags_id.notes', 'tags_id.metadata', 'tags_id.name'], 'x'),
		).toEqual({
			_or: [{ tags_id: { name: { _icontains: 'x' } } }],
		});

		expect(getSearchFilter('articles_tags', ['tags_id.secret', 'tags_id.notes', 'tags_id.metadata'], 'x')).toBeNull();
	});

	test('should skip numbers the API would reject, or that are out of range for the column', () => {
		for (const search of ['1e3', '0x10', ' 2 ', 'Infinity', '1.5', '99999999999']) {
			expect(getSearchFilter('articles_tags', ['tags_id.id'], search)).toBeNull();
		}
	});
});

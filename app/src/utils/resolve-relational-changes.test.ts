import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, Mock, test, vi } from 'vitest';
import { cryptoStub } from '@/__utils__/crypto';
import { useFieldsStore } from '@/stores/fields';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { isRelationalChanges, resolveRelationalChanges } from '@/utils/resolve-relational-changes';

vi.stubGlobal('crypto', cryptoStub);

vi.mock('@/utils/get-related-collection');

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn }));

	(getRelatedCollection as Mock).mockImplementation((collection: string, field: string) => {
		if (collection === 'page_content_part' && field === 'translations') {
			return { relatedCollection: 'page_content_part_translations' };
		}

		return null;
	});

	const fieldsStore = useFieldsStore();

	(fieldsStore.getPrimaryKeyFieldForCollection as Mock).mockImplementation((collection: string) => ({
		collection,
		field: 'id',
	}));
});

test('detects a relational changes object', () => {
	expect(isRelationalChanges({ create: [], update: [], delete: [] })).toBe(true);
	expect(isRelationalChanges({ create: [{ title: 'a' }] })).toBe(true);
	expect(isRelationalChanges([{ title: 'a' }])).toBe(false);
	expect(isRelationalChanges({ title: 'a' })).toBe(false);
	expect(isRelationalChanges({ create: [], title: 'a' })).toBe(false);
	expect(isRelationalChanges(null)).toBe(false);
	expect(isRelationalChanges({})).toBe(false);
});

test('resolves nested creations on an item that does not exist yet', () => {
	const item = {
		translations: {
			create: [{ page_languages_code: 'en-US', title: 'Prelude' }],
			update: [],
			delete: [],
		},
	};

	expect(resolveRelationalChanges('page_content_part', item)).toEqual({
		translations: [{ page_languages_code: 'en-US', title: 'Prelude' }],
	});
});

test('merges nested updates into the existing values', () => {
	const item = {
		id: 'abc',
		translations: {
			create: [],
			update: [{ id: 1, title: 'Renamed' }],
			delete: [],
		},
	};

	const existing = { id: 'abc', translations: [{ id: 1, title: 'Introduction', content: 'Body' }] };

	expect(resolveRelationalChanges('page_content_part', item, existing)).toEqual({
		id: 'abc',
		translations: [{ id: 1, title: 'Renamed', content: 'Body' }],
	});
});

test('drops nested deletions and appends nested creations', () => {
	const item = {
		id: 'abc',
		translations: {
			create: [{ page_languages_code: 'de-DE', title: 'Einleitung' }],
			update: [],
			delete: [1],
		},
	};

	const existing = {
		id: 'abc',
		translations: [
			{ id: 1, title: 'Introduction' },
			{ id: 2, title: 'Introduzione' },
		],
	};

	expect(resolveRelationalChanges('page_content_part', item, existing)).toEqual({
		id: 'abc',
		translations: [
			{ id: 2, title: 'Introduzione' },
			{ page_languages_code: 'de-DE', title: 'Einleitung' },
		],
	});
});

test('keeps a nested entry dropped when it is both updated and deleted', () => {
	const item = {
		id: 'abc',
		translations: {
			create: [],
			update: [{ id: 1, title: 'Renamed' }],
			delete: [1],
		},
	};

	const existing = { id: 'abc', translations: [{ id: 1, title: 'Introduction' }] };

	expect(resolveRelationalChanges('page_content_part', item, existing)).toEqual({
		id: 'abc',
		translations: [],
	});
});

test('does not duplicate nested entries whose fetched values carry no primary key', () => {
	const item = {
		id: 'abc',
		translations: {
			create: [{ page_languages_code: 'de-DE' }],
			update: [{ id: 1, page_languages_code: 'en-GB' }],
			delete: [],
		},
	};

	// A multi-hop template such as `translations.page_languages_code.name` only augments the leaf
	// primary key, so the rows in between come back without one and cannot be matched
	const existing = { id: 'abc', translations: [{ page_languages_code: { code: 'en-US', name: 'English' } }] };

	expect(resolveRelationalChanges('page_content_part', item, existing)).toEqual({
		id: 'abc',
		translations: [{ page_languages_code: { code: 'en-US', name: 'English' } }, { page_languages_code: 'de-DE' }],
	});
});

test('leaves non-relational fields that happen to match the changes shape untouched', () => {
	const item = { payload: { create: [{ a: 1 }], update: [], delete: [] } };

	expect(resolveRelationalChanges('page_content_part', item)).toEqual(item);
});

test('leaves plain values untouched', () => {
	const item = { id: 'abc', translations: [{ id: 1, title: 'Introduction' }] };

	expect(resolveRelationalChanges('page_content_part', item)).toEqual(item);
});

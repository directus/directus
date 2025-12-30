import { afterEach, beforeEach, expect, Mock, test, vi } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import { cryptoStub } from '@/__utils__/crypto';

vi.stubGlobal('crypto', cryptoStub);

import { useFieldsStore } from '@/stores/fields';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);
});

test('Returns empty array when empty array is passed', () => {
	const output = addRelatedPrimaryKeyToFields('articles', []);
	expect(output).toEqual([]);
});

test('Returns array as-is if no relational fields are passed', () => {
	const output = addRelatedPrimaryKeyToFields('articles', ['id', 'title']);
	expect(output).toEqual(['id', 'title']);
});

test('Retrieves related primary key from store and adds to array', () => {
	const store = useFieldsStore();
	(store.getField as Mock).mockReturnValueOnce({ collection: 'test' });
	(store.getPrimaryKeyFieldForCollection as Mock).mockReturnValueOnce({ field: 'test_pk' });

	const output = addRelatedPrimaryKeyToFields('articles', ['id', 'title', 'author.name']);
	expect(output).toEqual(['id', 'title', 'author.name', 'author.test_pk']);
});

test('Ignores adding primary key related collection cannot be found', () => {
	const store = useFieldsStore();
	(store.getField as Mock).mockReturnValueOnce(undefined);

	const output = addRelatedPrimaryKeyToFields('articles', ['id', 'title', 'author.name']);
	expect(output).toEqual(['id', 'title', 'author.name']);
});

test('Ignores adding primary key if it already exists', () => {
	const store = useFieldsStore();
	(store.getField as Mock).mockReturnValueOnce({ collection: 'test' });
	(store.getPrimaryKeyFieldForCollection as Mock).mockReturnValueOnce({ field: 'test_pk' });

	const output = addRelatedPrimaryKeyToFields('articles', ['id', 'title', 'author.name', 'author.title']);
	expect(output).toEqual(['id', 'title', 'author.name', 'author.test_pk', 'author.title']);
});

afterEach(() => {
	vi.clearAllMocks();
});

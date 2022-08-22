import { test, expect, vi, beforeEach, Mock } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import { cryptoStub } from '@/__utils__/crypto';
vi.stubGlobal('crypto', cryptoStub);

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		})
	);
});

import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getLocalTypeForField } from './get-local-type';

test('Returns NULL for non-existing relations', () => {
	const fieldsStore = useFieldsStore();
	(fieldsStore.getField as Mock).mockReturnValue(null);

	expect(getLocalTypeForField('non-existing', 'non-existing')).toBe(null);
});

test('Returns GROUP for Alias', () => {
	const fieldsStore = useFieldsStore();
	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'test_collection',
		field: 'test_fields',
		type: 'alias',
		meta: {
			collection: 'test_collection',
			field: 'test_fields',
			special: ['group'],
		},
		name: 'Test Field',
	});

	const relationsStore = useRelationsStore();
	(relationsStore.getRelationsForField as Mock).mockReturnValue([]);

	expect(getLocalTypeForField('test_collection', 'test_fields')).toBe('group');
});

test('Returns PRESENTATION for Alias', () => {
	const fieldsStore = useFieldsStore();
	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'test_collection',
		field: 'test_fields',
		type: 'alias',
		meta: {
			collection: 'test_collection',
			field: 'test_fields',
			special: ['alias'],
			group: null,
		},
		name: 'Test Field',
	});

	const relationsStore = useRelationsStore();
	(relationsStore.getRelationsForField as Mock).mockReturnValue([]);

	expect(getLocalTypeForField('test_collection', 'test_fields')).toBe('presentation');
});

test('Returns STANDARD with no relations', () => {
	const fieldsStore = useFieldsStore();
	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'test_collection',
		field: 'test_fields',
		type: 'unkown',
		meta: {
			collection: 'test_collection',
			field: 'test_fields',
			special: ['alias'],
			group: null,
		},
		name: 'Test Field',
	});

	const relationsStore = useRelationsStore();
	(relationsStore.getRelationsForField as Mock).mockReturnValue([]);

	expect(getLocalTypeForField('test_collection', 'test_fields')).toBe('standard');
});

test('Returns FILE for m2o relations to directus_files', () => {
	const fieldsStore = useFieldsStore();
	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'test_collection',
		field: 'test_fields',
		type: 'uuid',
		meta: {
			collection: 'test_collection',
			field: 'test_fields',
			special: ['file'],
		},
		name: 'Test Fields',
	});

	const relationsStore = useRelationsStore();
	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{
			collection: 'test_collection',
			field: 'test_fields',
			related_collection: 'directus_files',
			meta: {
				many_collection: 'test_collection',
				many_field: 'test_fields',
				one_collection: 'directus_files',
				one_field: null,
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	]);

	expect(getLocalTypeForField('test_collection', 'test_fields')).toBe('file');
});

test('Returns M2O', () => {
	const fieldsStore = useFieldsStore();
	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'test_collection',
		field: 'test_fields',
		type: 'uuid',
		meta: {
			collection: 'test_collection',
			field: 'test_fields',
			special: ['file'],
		},
		name: 'Test Fields',
	});

	const relationsStore = useRelationsStore();
	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{
			collection: 'test_collection',
			field: 'test_fields',
			related_collection: 'other_collection',
			meta: {
				many_collection: 'test_collection',
				many_field: 'test_fields',
				one_collection: 'other_collection',
				one_field: null,
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	]);

	expect(getLocalTypeForField('test_collection', 'test_fields')).toBe('m2o');
});

// test('Returns O2M', () => {

// });

// test('Returns TRANSLATIONS for special M2M relations', () => {

// });

// test('Returns M2A', () => {

// });

// test('Returns M2O for searched relation', () => {

// });

// test('Returns FILES for M2M relations to directus_files', () => {

// });

// test('Returns M2M ', () => {

// });

// test('Returns STANDARD as final fallback', () => {

// });

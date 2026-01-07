import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, Mock, test, vi } from 'vitest';
import { getLocalTypeForField } from './get-local-type';
import { cryptoStub } from '@/__utils__/crypto';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

vi.stubGlobal('crypto', cryptoStub);

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);
});

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

test('Returns O2M', () => {
	const fieldsStore = useFieldsStore();

	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'test_collection',
		field: 'test_fields',
		type: 'alias',
		meta: {
			collection: 'test_collection',
			field: 'test_fields',
			special: ['o2m'],
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
				many_collection: 'directus_files',
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

	expect(getLocalTypeForField('directus_files', 'test_field')).toBe('o2m');
});

test('Returns TRANSLATIONS for special M2M relations', () => {
	const fieldsStore = useFieldsStore();

	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'test_collection',
		field: 'translations',
		type: 'alias',
		schema: null,
		meta: {
			collection: 'test_collection',
			field: 'translations',
			special: ['translations'],
			interface: 'translations',
		},
		name: 'Translations',
	});

	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{
			collection: 'test_collection_translations',
			field: 'test_collection_id',
			related_collection: 'test_collection',
			meta: {
				id: 11,
				many_collection: 'test_collection_translations',
				many_field: 'test_collection_id',
				one_collection: 'test_collection',
				one_field: 'translations',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'languages_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
		{
			collection: 'test_collection_translations',
			field: 'languages_id',
			related_collection: 'languages',
			meta: {
				many_collection: 'test_collection_translations',
				many_field: 'languages_id',
				one_collection: 'languages',
				one_field: null,
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'test_collection_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	]);

	expect(getLocalTypeForField('directus_files', 'test_field')).toBe('translations');
});

test('Returns M2A', () => {
	const fieldsStore = useFieldsStore();

	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'collection_a',
		field: 'm2a',
		type: 'alias',
		schema: null,
		meta: {
			id: 25,
			collection: 'collection_a',
			field: 'm2a',
			special: ['m2a'],
			interface: 'list-m2a',
		},
		name: 'M2a',
	});

	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{
			collection: 'test_collection_m2a',
			field: 'test_collection_id',
			related_collection: 'test_collection',
			meta: {
				many_collection: 'test_collection_m2a',
				many_field: 'test_collection_id',
				one_collection: 'test_collection',
				one_field: 'm2a',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'item',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
		{
			collection: 'test_collection_m2a',
			field: 'item',
			related_collection: null,
			schema: null,
			meta: {
				many_collection: 'test_collection_m2a',
				many_field: 'item',
				one_collection: null,
				one_field: null,
				one_collection_field: 'field',
				one_allowed_collections: ['test_collection2'],
				junction_field: 'test_collection_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	]);

	expect(getLocalTypeForField('test_collection', 'test_field')).toBe('m2a');
});

test('Returns M2O for searched relation', () => {
	const fieldsStore = useFieldsStore();

	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'collection_a',
		field: 'relation',
		type: 'alias',
		schema: null,
		meta: {
			collection: 'collection_a',
			field: 'relation',
			special: ['m2m'],
			interface: 'list-m2m',
		},
		name: 'Relation',
	});

	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{
			collection: 'collection_a_collection_b',
			field: 'collection_a_id',
			related_collection: 'collection_b',
			meta: {
				many_collection: 'collection_a_collection_b',
				many_field: 'collection_a_id',
				one_collection: 'collection_a',
				one_field: 'test_field',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'collection_b_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
		{
			collection: 'collection_a',
			field: 'test_field',
			related_collection: 'collection_b',
			meta: {
				many_collection: 'collection_a_collection_b',
				many_field: 'collection_b_id',
				one_collection: 'collection_b',
				one_field: null,
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'collection_a_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	]);

	expect(getLocalTypeForField('collection_a', 'test_field')).toBe('m2o');
});

test('Returns FILES for M2M relations to directus_files', () => {
	const fieldsStore = useFieldsStore();

	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'collection_a',
		field: 'relation',
		type: 'alias',
		schema: null,
		meta: {
			collection: 'collection_a',
			field: 'relation',
			special: ['m2m'],
			interface: 'list-m2m',
		},
		name: 'Relation',
	});

	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{
			collection: 'collection_a_directus_files',
			field: 'collection_a_id',
			related_collection: 'collection_a',
			meta: {
				many_collection: 'collection_a_directus_files',
				many_field: 'collection_a_id',
				one_collection: 'collection_a',
				one_field: 'relation',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'directus_files_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
		{
			collection: 'collection_a_directus_files',
			field: 'directus_files_id',
			related_collection: 'directus_files',
			meta: {
				many_collection: 'collection_a_directus_files',
				many_field: 'directus_files_id',
				one_collection: 'directus_files',
				one_field: null,
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'collection_a_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	]);

	expect(getLocalTypeForField('collection_a', 'test_field')).toBe('files');
});

test('Returns M2M ', () => {
	const fieldsStore = useFieldsStore();

	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'collection_a',
		field: 'relation',
		type: 'alias',
		schema: null,
		meta: {
			collection: 'collection_a',
			field: 'relation',
			special: ['m2m'],
			interface: 'list-m2m',
		},
		name: 'Relation',
	});

	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{
			collection: 'collection_a_collection_b',
			field: 'collection_a_id',
			related_collection: 'collection_a',
			meta: {
				many_collection: 'collection_a_collection_b',
				many_field: 'collection_a_id',
				one_collection: 'collection_a',
				one_field: 'relation',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'collection_b_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
		{
			collection: 'collection_a_collection_b',
			field: 'collection_b_id',
			related_collection: 'collection_b',
			meta: {
				many_collection: 'collection_a_collection_b',
				many_field: 'collection_b_id',
				one_collection: 'collection_b',
				one_field: null,
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'collection_a_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	]);

	expect(getLocalTypeForField('collection_a', 'test_field')).toBe('m2m');
});

test('Returns STANDARD as final fallback', () => {
	const fieldsStore = useFieldsStore();

	(fieldsStore.getField as Mock).mockReturnValue({
		collection: 'test_collection',
		field: 'test',
		type: 'alias',
		schema: null,
		meta: {
			collection: 'test_collection',
			field: 'standard',
			special: null,
			interface: 'list-m2a',
		},
		name: 'test_collection',
	});

	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{ doesnt: 'matter' },
		{ doesnt: 'matter' },
		{ doesnt: 'matter' },
		// only way yo get here is to have 3 or more relations returned
	]);

	expect(getLocalTypeForField('test_collection', 'test_field')).toBe('standard');
});

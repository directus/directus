import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { cryptoStub } from '@/__utils__/crypto';

vi.stubGlobal('crypto', cryptoStub);

import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { useFieldDetailStore } from './index';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

vi.mock('@/api', () => {
	return {
		default: {
			get: (path: string) => {
				// stub for `/fields/:collection/:field` route
				if (/^\/fields\/.+\/.+$/.test(path)) return Promise.resolve({ data: {} });

				return Promise.reject(new Error(`Path "${path}" is not mocked in this test`));
			},
		},
	};
});

describe('Actions', () => {
	describe('startEditing', () => {
		it('New Field', () => {
			const fieldDetailStore = useFieldDetailStore();

			const testValue: { collection: string; field: string; localType: 'presentation' } = {
				collection: 'collection_a',
				field: '+',
				localType: 'presentation',
			};

			fieldDetailStore.startEditing(testValue.collection, testValue.field, testValue.localType);
			expect(fieldDetailStore.collection).toEqual(testValue.collection);
			expect(fieldDetailStore.field.collection).toEqual(testValue.collection);
			expect(fieldDetailStore.editing).toEqual(testValue.field);
			expect(fieldDetailStore.localType).toEqual(testValue.localType);
		});

		it('Existing Field — M2O', () => {
			const mockedField = {
				collection: 'collection_a',
				field: 'collection_a_field',
				type: 'alias',
				meta: {
					collection: 'collection_a',
					field: 'collection_a_field',
				},
				name: 'Collection A Field',
			};

			const fieldsStore = useFieldsStore();
			(fieldsStore.getField as Mock).mockReturnValue(mockedField);

			const mockedRelations = [
				{
					collection: 'collection_a',
					field: 'collection_a_field',
					related_collection: 'collection_b',
					meta: {
						many_collection: 'collection_a',
						many_field: 'collection_a_field',
						one_collection: 'collection_b',
						one_field: null,
						one_collection_field: null,
						one_allowed_collections: null,
						junction_field: null,
						sort_field: null,
						one_deselect_action: 'nullify',
					},
				},
			];

			const relationsStore = useRelationsStore();
			(relationsStore.getRelationsForField as Mock).mockReturnValue(mockedRelations);

			const fieldDetailStore = useFieldDetailStore();
			fieldDetailStore.startEditing(mockedField.collection, mockedField.field);
			expect(fieldDetailStore.collection).toEqual(mockedField.collection);
			expect(fieldDetailStore.field.collection).toEqual(mockedField.collection);
			expect(fieldDetailStore.editing).toEqual(mockedField.field);
			expect(fieldDetailStore.field.name).toEqual(mockedField.name);
			expect(fieldDetailStore.localType).toEqual('m2o');
			expect(fieldDetailStore.relations.o2m).toEqual(undefined);

			expect(fieldDetailStore.relations.m2o).toEqual(
				mockedRelations.find(
					(relation) => relation.collection === mockedField.collection && relation.field === mockedField.field,
				),
			);
		});
	});

	it.todo('Existing Field — M2M');
});

describe('Alterations', () => {
	describe('files', () => {
		it('autoGenerateJunctionRelation has changed', () => {
			const fieldDetailStore = useFieldDetailStore();

			const testValue: { collection: string; field: string; localType: 'files' } = {
				collection: 'collection_a',
				field: '+',
				localType: 'files',
			};

			fieldDetailStore.startEditing(testValue.collection, testValue.field, testValue.localType);

			const fieldsStore = useFieldsStore();

			(fieldsStore.getPrimaryKeyFieldForCollection as Mock).mockReturnValue({
				collection: 'collection_a',
				field: 'id',
			});

			expect(fieldDetailStore.collection).toEqual(testValue.collection);
			expect(fieldDetailStore.field.collection).toEqual(testValue.collection);
			expect(fieldDetailStore.editing).toEqual(testValue.field);
			expect(fieldDetailStore.relations.o2m?.collection).toEqual('collection_a_files');
			expect(fieldDetailStore.relations.o2m?.field).toEqual('collection_a_id');
			expect(fieldDetailStore.relations.m2o?.related_collection).toEqual('directus_files');
			expect(fieldDetailStore.relations.m2o?.field).toEqual('directus_files_id');

			fieldDetailStore.update({ autoGenerateJunctionRelation: false });

			fieldDetailStore.update({
				relations: {
					o2m: {
						collection: 'custom_files',
					},
				},
			});

			fieldDetailStore.update({ autoGenerateJunctionRelation: true });

			expect(fieldDetailStore.relations.o2m?.collection).toEqual('collection_a_files');
			expect(fieldDetailStore.relations.o2m?.field).toEqual('collection_a_id');
			expect(fieldDetailStore.relations.m2o?.related_collection).toEqual('directus_files');
			expect(fieldDetailStore.relations.m2o?.field).toEqual('directus_files_id');
		});
	});
});

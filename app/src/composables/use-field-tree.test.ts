import type { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';
import { ref, unref } from 'vue';
import { cryptoStub } from '@/__utils__/crypto';
import { useFieldTree } from '@/composables/use-field-tree';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

vi.stubGlobal('crypto', cryptoStub);

vi.mock('vue-i18n', async (importOriginal) => {
	const actual = await importOriginal<typeof import('vue-i18n')>();
	return {
		...actual,
		useI18n: () => ({
			t: (key: string) => (key === 'loading' ? 'Loading...' : key),
		}),
	};
});

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

test('Returns tree list of same length', () => {
	const fieldsStore = useFieldsStore();

	fieldsStore.fields = [
		{
			collection: 'a',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 1,
				collection: 'a',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,

				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'a',
			field: 'title',
			type: 'string',
			schema: {},
			meta: {
				id: 2,
				collection: 'a',
				field: 'title',
				special: null,
				readonly: false,
				hidden: false,
				required: false,
				group: null,
			},
			name: 'Title',
		},
	] as Field[];

	const relationsStore = useRelationsStore();
	relationsStore.relations = [] as Relation[];

	const { treeList } = useFieldTree(ref('a'));

	expect(unref(treeList)).toEqual([
		{ name: 'ID', field: 'id', collection: 'a', relatedCollection: undefined, key: 'id', path: 'id', type: 'integer' },
		{
			name: 'Title',
			field: 'title',
			collection: 'a',
			relatedCollection: undefined,
			key: 'title',
			path: 'title',
			type: 'string',
		},
	]);
});

test('Returns tree list with injected field', () => {
	const fieldsStore = useFieldsStore();

	fieldsStore.fields = [
		{
			collection: 'a',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 1,
				collection: 'a',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'a',
			field: 'title',
			type: 'string',
			schema: {},
			meta: {
				id: 2,
				collection: 'a',
				field: 'title',
				special: null,
				readonly: false,
				hidden: false,
				required: false,
				group: null,
			},
			name: 'Title',
		},
	] as Field[];

	const relationsStore = useRelationsStore();
	relationsStore.relations = [] as Relation[];

	const { treeList } = useFieldTree(
		ref('a'),
		ref({
			fields: [
				{
					collection: 'a',
					field: 'injected_field',
					type: 'string',
					schema: {},
					meta: {
						id: 3,
						collection: 'a',
						field: 'injected_field',
						special: null,
						readonly: true,
						hidden: true,
						required: false,
						group: null,
					},
					name: 'Injected Field',
				},
			] as Field[],
			relations: [] as Relation[],
		}),
	);

	expect(unref(treeList)).toEqual([
		{ name: 'ID', field: 'id', collection: 'a', relatedCollection: undefined, key: 'id', path: 'id', type: 'integer' },
		{
			name: 'Title',
			field: 'title',
			collection: 'a',
			relatedCollection: undefined,
			key: 'title',
			path: 'title',
			type: 'string',
		},
		{
			name: 'Injected Field',
			field: 'injected_field',
			collection: 'a',
			relatedCollection: undefined,
			key: 'injected_field',
			path: 'injected_field',
			type: 'string',
		},
	]);
});

test('Returns tree list with filter', () => {
	const fieldsStore = useFieldsStore();

	fieldsStore.fields = [
		{
			collection: 'a',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 1,
				collection: 'a',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'a',
			field: 'title',
			type: 'string',
			schema: {},
			meta: {
				id: 2,
				collection: 'a',
				field: 'title',
				special: null,
				readonly: false,
				hidden: false,
				required: false,
				group: null,
			},
			name: 'Title',
		},
	] as Field[];

	const relationsStore = useRelationsStore();
	relationsStore.relations = [] as Relation[];

	function filterIntegerFields(field: Field): boolean {
		if (field.type !== 'integer') return false;
		return true;
	}

	const { treeList } = useFieldTree(ref('a'), undefined, filterIntegerFields);

	expect(unref(treeList)).toHaveLength(1);

	expect(unref(treeList)).toEqual([
		{ name: 'ID', field: 'id', collection: 'a', relatedCollection: undefined, key: 'id', path: 'id', type: 'integer' },
	]);
});

test('Returns tree list with group', () => {
	const fieldsStore = useFieldsStore();

	fieldsStore.fields = [
		{
			collection: 'a',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 1,
				collection: 'a',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'a',
			field: 'raw_group',
			type: 'alias',
			schema: null,
			meta: {
				id: 2,
				collection: 'a',
				field: 'raw_group',
				special: ['alias', 'no-data', 'group'],
				readonly: false,
				hidden: false,
				required: false,
				group: null,
			},
			name: 'Raw Group',
		},
		{
			collection: 'a',
			field: 'title',
			type: 'string',
			schema: {},
			meta: {
				id: 3,
				collection: 'a',
				field: 'title',
				special: null,
				readonly: false,
				hidden: false,
				required: false,
				group: 'raw_group',
			},
			name: 'Title',
		},
	] as Field[];

	const relationsStore = useRelationsStore();
	relationsStore.relations = [] as Relation[];

	const { treeList } = useFieldTree(ref('a'));

	expect(unref(treeList)).toEqual([
		{ name: 'ID', field: 'id', collection: 'a', key: 'id', path: 'id', type: 'integer' },
		{
			name: 'Raw Group',
			field: 'raw_group',
			collection: 'a',
			key: '',
			path: 'raw_group',
			group: true,
			type: 'alias',
			children: [
				{
					name: 'Title',
					field: 'title',
					collection: 'a',
					key: 'title',
					path: 'raw_group.title',
					type: 'string',
				},
			],
		},
	]);
});

test('Returns tree list for O2M', () => {
	const fieldsStore = useFieldsStore();

	fieldsStore.fields = [
		{
			collection: 'a',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 1,
				collection: 'a',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'a',
			field: 'o2m_b',
			type: 'alias',
			schema: null,
			meta: {
				id: 2,
				collection: 'a',
				field: 'o2m_b',
				special: ['o2m'],
				readonly: false,
				hidden: false,
				required: false,
				group: null,
			},
			name: 'O2M B',
		},
		{
			collection: 'b',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 3,
				collection: 'b',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'b',
			field: 'title',
			type: 'string',
			schema: {},
			meta: {
				id: 4,
				collection: 'b',
				field: 'title',
				special: null,
				readonly: false,
				hidden: false,
				required: false,
				group: null,
			},
			name: 'Title',
		},
		{
			collection: 'b',
			field: 'a',
			type: 'integer',
			schema: {},
			meta: {
				id: 5,
				collection: 'b',
				field: 'a',
				special: null,
				readonly: false,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'A',
		},
	] as Field[];

	const relationsStore = useRelationsStore();

	relationsStore.relations = [
		{
			collection: 'b',
			field: 'a',
			related_collection: 'a',
			schema: {},
			meta: {
				id: 1,
				many_collection: 'b',
				many_field: 'a',
				one_collection: 'a',
				one_field: 'o2m_b',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	] as Relation[];

	const { treeList } = useFieldTree(ref('a'));

	expect(unref(treeList)).toEqual([
		{ name: 'ID', field: 'id', collection: 'a', key: 'id', path: 'id', type: 'integer' },
		{
			name: 'O2M B',
			field: 'o2m_b',
			collection: 'a',
			relatedCollection: 'b',
			key: 'o2m_b',
			path: 'o2m_b',
			type: 'alias',
			children: [
				{
					name: 'ID',
					field: 'id',
					collection: 'b',
					key: 'o2m_b.id',
					path: 'o2m_b.id',
					type: 'integer',
				},
				{
					name: 'Title',
					field: 'title',
					collection: 'b',
					key: 'o2m_b.title',
					path: 'o2m_b.title',
					type: 'string',
				},
				{
					name: 'A',
					field: 'a',
					collection: 'b',
					relatedCollection: 'a',
					key: 'o2m_b.a',
					path: 'o2m_b.a',
					type: 'integer',
				},
			],
		},
	]);
});

test('Returns tree list for M2O', () => {
	const fieldsStore = useFieldsStore();

	fieldsStore.fields = [
		{
			collection: 'a',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 1,
				collection: 'a',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'a',
			field: 'm2o_b',
			type: 'integer',
			schema: {},
			meta: {
				id: 2,
				collection: 'a',
				field: 'm2o_b',
				special: ['m2o'],
				readonly: false,
				hidden: false,
				required: false,
				group: null,
			},
			name: 'M2O B',
		},
		{
			collection: 'b',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 3,
				collection: 'b',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
	] as Field[];

	const relationsStore = useRelationsStore();

	relationsStore.relations = [
		{
			collection: 'a',
			field: 'm2o_b',
			related_collection: 'b',
			schema: {},
			meta: {
				id: 1,
				many_collection: 'a',
				many_field: 'm2o_b',
				one_collection: 'b',
				one_field: null,
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	] as Relation[];

	const { treeList } = useFieldTree(ref('a'));

	expect(unref(treeList)).toEqual([
		{ name: 'ID', field: 'id', collection: 'a', key: 'id', path: 'id', type: 'integer' },
		{
			name: 'M2O B',
			field: 'm2o_b',
			collection: 'a',
			relatedCollection: 'b',
			key: 'm2o_b',
			path: 'm2o_b',
			type: 'integer',
			children: [
				{
					name: 'ID',
					field: 'id',
					collection: 'b',
					key: 'm2o_b.id',
					path: 'm2o_b.id',
					type: 'integer',
				},
			],
		},
	]);
});

test('Returns tree list for M2A with single related collection', () => {
	const fieldsStore = useFieldsStore();

	fieldsStore.fields = [
		{
			collection: 'a',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 1,
				collection: 'a',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'a',
			field: 'm2a',
			type: 'alias',
			schema: null,
			meta: {
				id: 2,
				collection: 'a',
				field: 'm2a',
				special: ['m2a'],
				readonly: false,
				hidden: false,
				required: false,
				group: null,
			},
			name: 'M2A',
		},
		{
			collection: 'a_m2a',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 3,
				collection: 'a_m2a',
				field: 'id',
				special: null,
				readonly: false,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'a_m2a',
			field: 'a_id',
			type: 'integer',
			schema: {},
			meta: {
				id: 4,
				collection: 'a_m2a',
				field: 'a_id',
				special: null,
				readonly: false,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'A ID',
		},
		{
			collection: 'a_m2a',
			field: 'item',
			type: 'string',
			schema: {},
			meta: {
				id: 5,
				collection: 'a_m2a',
				field: 'item',
				special: null,
				readonly: false,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'Item',
		},
		{
			collection: 'a_m2a',
			field: 'collection',
			type: 'string',
			schema: {},
			meta: {
				id: 6,
				collection: 'a_m2a',
				field: 'collection',
				special: null,
				readonly: false,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'Collection',
		},
		{
			collection: 'b',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 7,
				collection: 'b',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
	] as Field[];

	const relationsStore = useRelationsStore();

	relationsStore.relations = [
		{
			collection: 'a_m2a',
			field: 'a_id',
			related_collection: 'a',
			schema: {},
			meta: {
				id: 1,
				many_collection: 'a_m2a',
				many_field: 'a_id',
				one_collection: 'a',
				one_field: 'm2a',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'item',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
		{
			collection: 'a_m2a',
			field: 'item',
			related_collection: null,
			schema: null,
			meta: {
				id: 2,
				many_collection: 'a_m2a',
				many_field: 'item',
				one_collection: null,
				one_field: null,
				one_collection_field: 'collection',
				one_allowed_collections: ['b'],
				junction_field: 'a_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	] as Relation[];

	const { treeList } = useFieldTree(ref('a'));

	expect(unref(treeList)).toEqual([
		{ name: 'ID', field: 'id', collection: 'a', key: 'id', path: 'id', type: 'integer' },
		{
			name: 'M2A',
			field: 'm2a',
			collection: 'a',
			relatedCollection: 'a_m2a',
			key: 'm2a',
			path: 'm2a',
			type: 'alias',
			children: [
				{
					name: 'ID',
					field: 'id',
					collection: 'a_m2a',
					key: 'm2a.id',
					path: 'm2a.id',
					type: 'integer',
				},
				{
					name: 'A ID',
					field: 'a_id',
					collection: 'a_m2a',
					relatedCollection: 'a',
					key: 'm2a.a_id',
					path: 'm2a.a_id',
					type: 'integer',
				},
				{
					name: 'Item (b)',
					field: 'item:b',
					collection: 'a_m2a',
					relatedCollection: 'b',
					key: 'm2a.item:b',
					path: 'm2a.item:b',
					type: 'string',
				},
				{
					name: 'Collection',
					field: 'collection',
					collection: 'a_m2a',
					key: 'm2a.collection',
					path: 'm2a.collection',
					type: 'string',
				},
			],
		},
	]);
});

test('Returns tree list for M2A with multiple related collections', () => {
	const fieldsStore = useFieldsStore();

	fieldsStore.fields = [
		{
			collection: 'a',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 1,
				collection: 'a',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'a',
			field: 'm2a',
			type: 'alias',
			schema: null,
			meta: {
				id: 2,
				collection: 'a',
				field: 'm2a',
				special: ['m2a'],
				readonly: false,
				hidden: false,
				required: false,
				group: null,
			},
			name: 'M2A',
		},
		{
			collection: 'a_m2a',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 3,
				collection: 'a_m2a',
				field: 'id',
				special: null,
				readonly: false,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'a_m2a',
			field: 'a_id',
			type: 'integer',
			schema: {},
			meta: {
				id: 4,
				collection: 'a_m2a',
				field: 'a_id',
				special: null,
				readonly: false,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'A ID',
		},
		{
			collection: 'a_m2a',
			field: 'item',
			type: 'string',
			schema: {},
			meta: {
				id: 5,
				collection: 'a_m2a',
				field: 'item',
				special: null,
				readonly: false,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'Item',
		},
		{
			collection: 'a_m2a',
			field: 'collection',
			type: 'string',
			schema: {},
			meta: {
				id: 6,
				collection: 'a_m2a',
				field: 'collection',
				special: null,
				interface: null,
				options: null,
				display: null,
				display_options: null,
				readonly: false,
				hidden: true,
				sort: null,
				width: 'full',
				translations: null,
				note: null,
				conditions: null,
				required: false,
				group: null,
				validation: null,
				validation_message: null,
			},
			name: 'Collection',
		},
		{
			collection: 'b',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 7,
				collection: 'b',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
		{
			collection: 'c',
			field: 'id',
			type: 'integer',
			schema: {},
			meta: {
				id: 8,
				collection: 'c',
				field: 'id',
				special: null,
				readonly: true,
				hidden: true,
				required: false,
				group: null,
			},
			name: 'ID',
		},
	] as Field[];

	const relationsStore = useRelationsStore();

	relationsStore.relations = [
		{
			collection: 'a_m2a',
			field: 'a_id',
			related_collection: 'a',
			schema: {},
			meta: {
				id: 1,
				many_collection: 'a_m2a',
				many_field: 'a_id',
				one_collection: 'a',
				one_field: 'm2a',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'item',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
		{
			collection: 'a_m2a',
			field: 'item',
			related_collection: null,
			schema: null,
			meta: {
				id: 2,
				many_collection: 'a_m2a',
				many_field: 'item',
				one_collection: null,
				one_field: null,
				one_collection_field: 'collection',
				one_allowed_collections: ['b', 'c'],
				junction_field: 'a_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	] as Relation[];

	const { treeList } = useFieldTree(ref('a'));

	expect(unref(treeList)).toEqual([
		{ name: 'ID', field: 'id', collection: 'a', key: 'id', path: 'id', type: 'integer' },
		{
			name: 'M2A',
			field: 'm2a',
			collection: 'a',
			relatedCollection: 'a_m2a',
			key: 'm2a',
			path: 'm2a',
			type: 'alias',
			children: [
				{
					name: 'Collection',
					field: 'collection',
					collection: 'a_m2a',
					key: 'm2a.collection',
					path: 'm2a.collection',
					type: 'string',
				},
				{
					name: 'ID',
					field: 'id',
					collection: 'a_m2a',
					key: 'm2a.id',
					path: 'm2a.id',
					type: 'integer',
				},
				{
					name: 'A ID',
					field: 'a_id',
					collection: 'a_m2a',
					relatedCollection: 'a',
					key: 'm2a.a_id',
					path: 'm2a.a_id',
					type: 'integer',
				},
				{
					name: 'Item (b)',
					field: 'item:b',
					collection: 'a_m2a',
					relatedCollection: 'b',
					key: 'm2a.item:b',
					path: 'm2a.item:b',
					type: 'string',
				},
				{
					name: 'Item (c)',
					field: 'item:c',
					collection: 'a_m2a',
					relatedCollection: 'c',
					key: 'm2a.item:c',
					path: 'm2a.item:c',
					type: 'string',
				},
			],
		},
	]);
});

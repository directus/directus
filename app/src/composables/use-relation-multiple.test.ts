import { flushPromises, mount } from '@vue/test-utils';
import { cloneDeep } from 'lodash';
import { describe, expect, test, vi } from 'vitest';
import { computed, defineComponent, h, ref, toRefs } from 'vue';
import { RelationM2A } from './use-relation-m2a';
import { RelationO2M } from './use-relation-o2m';
import { RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';

vi.mock('@/sdk', async () => {
	const { mockSdk } = await import('@/test-utils/sdk');
	return mockSdk(({ path, params }) => {
		if (path === '/items/worker' && params?.aggregate?.count === 'id') {
			return Promise.resolve([{ count: { id: workerData.length } }]);
		} else if (path === '/items/worker') {
			return Promise.resolve(workerData);
		} else if (path === '/items/article_m2a' && params?.aggregate?.count === 'id') {
			return Promise.resolve([{ count: { id: m2aData.length } }]);
		} else {
			return Promise.resolve(m2aData);
		}
	});
});

vi.mock('@/utils/unexpected-error', () => {
	return {
		unexpectedError: (error: unknown) => {
			throw error;
		},
	};
});

const relationO2M: RelationO2M = {
	relatedCollection: {
		name: 'Worker',
		collection: 'worker',
		icon: 'user',
		meta: null,
		schema: null,
		type: 'table',
	},
	relatedPrimaryKeyField: {
		name: 'ID',
		collection: 'worker',
		field: 'id',
		type: 'integer',
		meta: null,
		schema: null,
	},
	reverseJunctionField: {
		name: 'Facility',
		collection: 'facility',
		field: 'facility',
		type: 'integer',
		meta: null,
		schema: null,
	},
	relation: {
		collection: 'worker',
		field: 'facility',
		related_collection: 'facility',
		meta: null,
		schema: null,
	},
	type: 'o2m',
};

const workerData: Record<string, any>[] = [
	{ id: 1, name: 'test', facility: 1 },
	{ id: 2, name: 'test2', facility: 1 },
	{ id: 3, name: 'test3', facility: 1 },
	{ id: 4, name: 'test4', facility: 1 },
];

const TestComponent = defineComponent({
	props: ['value', 'relation', 'id'], // eslint-disable-line vue/require-prop-types
	emits: ['update:value'],
	setup(props) {
		const valueRef = ref(props.value);
		const { relation, id } = toRefs(props);

		const query = computed<RelationQueryMultiple>(() => {
			const q: RelationQueryMultiple = {
				limit: 15,
				page: 1,
				fields: ['id'],
			};

			return q;
		});

		// eslint-disable-next-line vue/no-dupe-keys
		return { value: valueRef, ...useRelationMultiple(valueRef, query, relation, id, ref(null)) };
	},
	render: () => h('div'),
});

/*
Facility                 Worker
┌─────────────┐          ┌─────────────────┐
│id: number   │◄────┐    │id: number       │
│name: string │     │    │name: string     │
│workers      │     └────┤facility: number │
│             │          │                 │
│             │          │                 │
└─────────────┘          └─────────────────┘
 */

describe('test o2m relation', () => {
	test('creating an item', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.create({
			name: 'test5',
			facility: 1,
		});

		await flushPromises();

		expect(wrapper.vm.displayItems).toEqual([
			...workerData,
			{ name: 'test5', facility: 1, $type: 'created', $index: 0 },
		]);

		expect(wrapper.vm.value).toEqual({
			create: [
				{
					name: 'test5',
					facility: 1,
				},
			],
			update: [],
			delete: [],
		});
	});

	test('editing a created item', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.create({
			name: 'test5',
			facility: 1,
		});

		wrapper.vm.update({
			name: 'test5 edited',
			facility: 2,
			$type: 'created',
			$index: 0,
		});

		await flushPromises();

		expect(wrapper.vm.displayItems).toEqual([
			...workerData,
			{ name: 'test5 edited', facility: 2, $type: 'created', $index: 0 },
		]);

		expect(wrapper.vm.value).toEqual({
			create: [
				{
					name: 'test5 edited',
					facility: 2,
				},
			],
			update: [],
			delete: [],
		});
	});

	test('removing a created item', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.create({ name: 'test5', facility: 1 });

		wrapper.vm.remove({ name: 'test5', facility: 1, $type: 'created', $index: 0 });

		await flushPromises();

		expect(wrapper.vm.displayItems).toEqual(workerData);

		expect(wrapper.vm.value).toEqual(undefined);
	});

	test('updating an item', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.update({ id: 2, name: 'test2-edited' });

		await flushPromises();

		const changes = cloneDeep(workerData);
		changes.splice(1, 1, { id: 2, name: 'test2-edited', facility: 1, $edits: 0, $type: 'updated', $index: 0 });

		expect(wrapper.vm.displayItems).toEqual(changes);

		expect(wrapper.vm.value).toEqual({
			create: [],
			update: [
				{
					id: 2,
					name: 'test2-edited',
				},
			],
			delete: [],
		});
	});

	test('removing an item', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.remove({ id: 2 });

		await flushPromises();

		const changes = cloneDeep(workerData);
		changes.splice(1, 1, { id: 2, name: 'test2', facility: 1, $type: 'deleted', $index: 0 });

		expect(wrapper.vm.displayItems).toEqual(changes);
		expect(wrapper.vm.value).toEqual({ create: [], update: [], delete: [2] });
	});

	test('removing an edited item', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.update({ id: 2, name: 'test2-edited' });
		wrapper.vm.remove({ id: 1 });
		wrapper.vm.remove({ id: 2 });

		await flushPromises();

		const changes = cloneDeep(workerData);
		changes.splice(1, 1, { id: 2, name: 'test2-edited', facility: 1, $type: 'deleted', $index: 1, $edits: 0 });
		changes.splice(0, 1, { id: 1, name: 'test', facility: 1, $type: 'deleted', $index: 0 });

		expect(wrapper.vm.displayItems).toEqual(changes);

		expect(wrapper.vm.value).toEqual({
			create: [],
			update: [
				{
					id: 2,
					name: 'test2-edited',
				},
			],
			delete: [1, 2],
		});
	});

	test('get item edits', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.update({ id: 2, name: 'test2-edited' });

		await flushPromises();

		expect(wrapper.vm.getItemEdits(wrapper.vm.displayItems.find((item) => item.id === 2) as any)).toEqual({
			id: 2,
			name: 'test2-edited',
			$type: 'updated',
			$index: 0,
		});
	});

	test('Initial data should be cleared when itemId changes to new item', async () => {
		// Mount component with existing itemId
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		// Wait for initial data to load
		await flushPromises();

		// Verify initial data is loaded for existing item
		expect(wrapper.vm.fetchedItems).toEqual(workerData);

		// Change itemId to '+' (new item) - simulates "save and create new"
		await wrapper.setProps({ id: '+' });

		// Wait for the change to settle
		await flushPromises();

		// For a new item, fetchedItems should be empty
		expect(wrapper.vm.fetchedItems).toEqual([]);

		// The component should not be in loading state
		expect(wrapper.vm.loading).toBe(false);
	});
});

const relationM2A: RelationM2A = {
	allowedCollections: [
		{
			name: 'Text',
			collection: 'text',
			icon: 'user',
			meta: null,
			schema: null,
			type: 'table',
		},
		{
			name: 'Code',
			collection: 'code',
			icon: 'user',
			meta: null,
			schema: null,
			type: 'table',
		},
	],
	collectionField: {
		name: 'Collection',
		collection: 'article_m2a',
		field: 'collection',
		type: 'string',
		meta: null,
		schema: null,
	},
	junction: {
		collection: 'article_m2a',
		field: 'article_id',
		related_collection: 'article',
		meta: {
			id: 1,
			junction_field: 'item',
			many_collection: 'article_m2a',
			many_field: 'article_id',
			one_allowed_collections: null,
			one_collection: 'article',
			one_collection_field: null,
			one_deselect_action: 'nullify',
			one_field: 'content',
			sort_field: 'sort',
		},
		schema: null,
	},
	relation: {
		collection: 'article_m2a',
		field: 'item',
		related_collection: null,
		meta: {
			id: 2,
			junction_field: 'many_id',
			many_collection: 'article_m2a',
			many_field: 'item',
			one_allowed_collections: ['text', 'code'],
			one_collection: null,
			one_collection_field: 'collection',
			one_deselect_action: 'nullify',
			one_field: null,
			sort_field: null,
		},
		schema: null,
	},
	junctionCollection: {
		collection: 'article_m2a',
		name: 'Article M2A',
		icon: 'import_export',
		type: 'table',
		schema: null,
		meta: null,
	},
	junctionField: {
		collection: 'article_m2a',
		field: 'item',
		type: 'string',
		name: 'Item',
		meta: null,
		schema: null,
	},
	junctionPrimaryKeyField: {
		collection: 'article_m2a',
		field: 'id',
		type: 'integer',
		name: 'ID',
		meta: null,
		schema: null,
	},
	relationPrimaryKeyFields: {
		text: {
			collection: 'text',
			field: 'id',
			type: 'integer',
			name: 'ID',
			meta: null,
			schema: null,
		},
		code: {
			collection: 'code',
			field: 'id',
			type: 'integer',
			name: 'ID',
			meta: null,
			schema: null,
		},
	},
	reverseJunctionField: {
		collection: 'article_m2a',
		field: 'article_id',
		type: 'integer',
		name: 'Article ID',
		meta: null,
		schema: null,
	},
	sortField: 'sort',
	type: 'm2a',
};

const m2aData: Record<string, any>[] = [
	{ id: 1, article_id: 1, item: { id: 1 }, collection: 'text', sort: 1 },
	{ id: 2, article_id: 1, item: { id: 2 }, collection: 'text', sort: 2 },
	{ id: 3, article_id: 1, item: { id: 1 }, collection: 'code', sort: 3 },
];

const TestComponentM2A = defineComponent({
	props: ['value', 'relation', 'id'], // eslint-disable-line vue/require-prop-types
	emits: ['update:value'],
	setup(props) {
		const valueRef = ref(props.value);
		const { relation, id } = toRefs(props);

		const query = computed<RelationQueryMultiple>(() => {
			const q: RelationQueryMultiple = {
				limit: 15,
				page: 1,
				fields: ['id'],
			};

			return q;
		});

		// eslint-disable-next-line vue/no-dupe-keys
		return { value: valueRef, ...useRelationMultiple(valueRef, query, relation, id, ref(null)) };
	},
	render: () => h('div'),
});

/*
Article           Many|Any: article_m2a                    ┌─Text
┌─────────┐       ┌────────────────────────────────┐       │ ┌─────────┐
│id       ├───┐   │id: junctionPKField             │    ┌──┼─┤id       │
│content  │   └──►│article_id: reverseJunctionField│    │  │ │text     │
└─────────┘       │item: junctionField             │◄───┤  │ └─────────┘
				      │sort: sortField                 │    │  │
				      │collection: collectionField     │◄───┼──┤
				      └────────────────────────────────┘    │  │
														              │  └─Code
				AllowedCollection: [Text,Code]		        │    ┌─────────┐
				relatedPKFields: {Text: id,Code: id}        └────┤id       │
															                │code     │
															                └─────────┘
*/

describe('test m2a relation', () => {
	test('sorting an item', async () => {
		const wrapper = mount(TestComponentM2A, {
			props: {
				relation: relationM2A,
				value: [],
				id: 1,
			},
		});

		wrapper.vm.update(
			{ id: 1, item: { id: 1 }, collection: 'text', sort: 2 },
			{ id: 2, item: { id: 2 }, collection: 'text', sort: 3 },
			{ id: 3, item: { id: 1 }, collection: 'code', sort: 1 },
		);

		await flushPromises();

		expect(wrapper.vm.displayItems).toEqual([
			{
				id: 3,
				article_id: 1,
				item: { id: 1 },
				collection: 'code',
				sort: 1,
				$type: 'updated',
				$index: 2,
				$edits: 2,
			},
			{
				id: 1,
				article_id: 1,
				item: { id: 1 },
				collection: 'text',
				sort: 2,
				$type: 'updated',
				$index: 0,
				$edits: 0,
			},
			{
				id: 2,
				article_id: 1,
				item: { id: 2 },
				collection: 'text',
				sort: 3,
				$type: 'updated',
				$index: 1,
				$edits: 1,
			},
		]);
	});
});

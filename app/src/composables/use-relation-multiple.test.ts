import { flushPromises, mount } from '@vue/test-utils';
import { cloneDeep } from 'lodash';
import { describe, expect, MockInstance, test, vi } from 'vitest';
import { computed, defineComponent, h, ref, toRefs } from 'vue';
import { RelationM2A } from './use-relation-m2a';
import { RelationO2M } from './use-relation-o2m';
import { provideRefreshSignal } from '@/composables/use-refresh-signal';
import { RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';
import sdk from '@/sdk';

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

// Rows that exist but are not related to the item yet, as reached through "Add Existing"
const selectableData: Record<string, Record<string, any>[]> = {
	'/items/worker': [{ id: 99, name: 'unlinked' }],
	'/items/text': [{ id: 5, text: 'lorem' }],
};

vi.mock('@/utils/fetch-all', () => ({
	fetchAll: (url: string, config: Record<string, any>) => {
		const ids: (string | number)[] = config?.params?.filter?.id?._in ?? [];
		return Promise.resolve((selectableData[url] ?? []).filter((item) => ids.includes(item.id)));
	},
}));

vi.mock('@/utils/unexpected-error', () => {
	return {
		unexpectedError: (error: unknown) => {
			throw error;
		},
	};
});

vi.mock('@/utils/get-related-collection', () => ({
	getRelatedCollection: (collection: string, field: string) => {
		if (collection === 'worker' && field === 'translations') return { relatedCollection: 'worker_translations' };
		if (collection === 'article_m2a' && field === 'item') return { relatedCollection: 'text' };
		if (collection === 'text' && field === 'translations') return { relatedCollection: 'text_translations' };
		return null;
	},
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getPrimaryKeyFieldForCollection: (collection: string) => ({ collection, field: 'id' }),
	}),
}));

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

	test('should use "_null" operator in filter when item id is "null"', async () => {
		const sdkSpy = vi.spyOn(sdk, 'request');

		mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: null },
		});

		await flushPromises();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual(
			expect.objectContaining({
				params: expect.objectContaining({
					filter: {
						_and: [
							{
								facility: {
									_null: true,
								},
							},
						],
					},
				}),
			}),
		);
	});

	test('should use value directly in filter when item id is defined', async () => {
		const sdkSpy = vi.spyOn(sdk, 'request');

		mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		await flushPromises();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual(
			expect.objectContaining({
				params: expect.objectContaining({
					filter: {
						_and: [
							{
								facility: 1,
							},
						],
					},
				}),
			}),
		);
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

describe('nested relational changes', () => {
	test('a created item exposes its nested creations as values, not as a delta', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		const changes = {
			create: [{ language: 'en-US', title: 'Prelude' }],
			update: [],
			delete: [],
		};

		wrapper.vm.create({ facility: 1, translations: changes });

		await flushPromises();

		expect(wrapper.vm.displayItems.at(-1)).toEqual({
			facility: 1,
			translations: [{ language: 'en-US', title: 'Prelude' }],
			$type: 'created',
			$index: 0,
			$staged: { translations: changes },
			$resolved: { translations: [{ language: 'en-US', title: 'Prelude' }] },
		});
	});

	test('resolving for display leaves the saved edits untouched', async () => {
		const changes = {
			create: [{ language: 'en-US', title: 'Prelude' }],
			update: [],
			delete: [],
		};

		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.create({ facility: 1, translations: changes });

		await flushPromises();

		expect(wrapper.vm.value).toEqual({
			create: [{ facility: 1, translations: changes }],
			update: [],
			delete: [],
		});
	});

	test('handing a display item back to update re-emits the delta, not the resolved values', async () => {
		const changes = {
			create: [{ language: 'en-US', title: 'Prelude' }],
			update: [],
			delete: [],
		};

		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.create({ facility: 1, translations: changes });

		await flushPromises();

		// Mirrors interfaces that spread a display item straight into update(), such as the tree view
		wrapper.vm.update({ ...wrapper.vm.displayItems.at(-1), sort: 1 });

		await flushPromises();

		expect(wrapper.vm.value).toEqual({
			create: [{ facility: 1, translations: changes, sort: 1 }],
			update: [],
			delete: [],
		});
	});

	test('a deep-cloned display item handed back to update re-emits the delta', async () => {
		const changes = {
			create: [{ language: 'en-US', title: 'Prelude' }],
			update: [],
			delete: [],
		};

		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.create({ facility: 1, translations: changes });

		await flushPromises();

		// Mirrors the sort handlers, which clone the display items before reordering them
		wrapper.vm.update({ ...cloneDeep(wrapper.vm.displayItems.at(-1)), sort: 1 });

		await flushPromises();

		expect(wrapper.vm.value).toEqual({
			create: [{ facility: 1, translations: changes, sort: 1 }],
			update: [],
			delete: [],
		});
	});

	test('an updated item exposes its nested changes as values', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		const changes = {
			create: [{ language: 'de-DE', title: 'Vorspiel' }],
			update: [],
			delete: [],
		};

		wrapper.vm.update({ id: 1, translations: changes });

		await flushPromises();

		expect(wrapper.vm.displayItems[0]).toEqual({
			id: 1,
			name: 'test',
			facility: 1,
			translations: [{ language: 'de-DE', title: 'Vorspiel' }],
			$type: 'updated',
			$index: 0,
			$edits: 0,
			$staged: { translations: changes },
			$resolved: { translations: [{ language: 'de-DE', title: 'Vorspiel' }] },
		});
	});

	test('replacing the field on a display item keeps the new delta', async () => {
		const oldChanges = {
			create: [{ language: 'en-US', title: 'Old' }],
			update: [],
			delete: [],
		};

		const newChanges = {
			create: [{ language: 'en-US', title: 'NEW' }],
			update: [],
			delete: [],
		};

		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.create({ facility: 1, translations: oldChanges });

		await flushPromises();

		// Mirrors NestedDraggable.updateModelValue: spread the display item, then replace the field itself
		wrapper.vm.update({ ...wrapper.vm.displayItems.at(-1), translations: newChanges });

		await flushPromises();

		expect(wrapper.vm.value).toEqual({
			create: [{ facility: 1, translations: newChanges }],
			update: [],
			delete: [],
		});
	});

	test('clearing the field on a display item does not bring the old delta back', async () => {
		const changes = {
			create: [{ language: 'en-US', title: 'Prelude' }],
			update: [],
			delete: [],
		};

		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.create({ facility: 1, translations: changes });

		await flushPromises();

		// A nested interface that drops all its changes emits `undefined` back up
		wrapper.vm.update({ ...wrapper.vm.displayItems.at(-1), translations: undefined });

		await flushPromises();

		expect(wrapper.vm.value).toEqual({
			create: [{ facility: 1 }],
			update: [],
			delete: [],
		});
	});

	test('a selected item exposes its nested changes as values', async () => {
		const changes = {
			create: [{ language: 'en-US', title: 'Prelude' }],
			update: [],
			delete: [],
		};

		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		await flushPromises();

		// "Add Existing" on an o2m stages the row in `update`, not in `create`
		wrapper.vm.select([99]);

		await flushPromises();

		const selected = wrapper.vm.displayItems.find((item) => item.id === 99)!;

		// Mirrors the drawer flow, which stages the form edits on top of the raw item edits
		wrapper.vm.update({ ...wrapper.vm.getItemEdits(selected), translations: changes });

		await flushPromises();

		expect(wrapper.vm.displayItems.find((item) => item.id === 99)).toEqual(
			expect.objectContaining({
				id: 99,
				name: 'unlinked',
				translations: [{ language: 'en-US', title: 'Prelude' }],
			}),
		);

		expect(wrapper.vm.value).toEqual({
			create: [],
			update: [{ id: 99, facility: 1, translations: changes }],
			delete: [],
		});
	});

	test('a selected item resolves nested changes against the values it already has', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		await flushPromises();

		wrapper.vm.select([99]);

		await flushPromises();

		const selected = wrapper.vm.displayItems.find((item) => item.id === 99)!;

		// A field the fetched row already holds must survive the resolution
		wrapper.vm.update({ ...selected, translations: { create: [], update: [], delete: [] } });

		await flushPromises();

		expect(wrapper.vm.displayItems.find((item) => item.id === 99)).toEqual(
			expect.objectContaining({ id: 99, name: 'unlinked', translations: [] }),
		);
	});

	test('a selected junction row exposes the nested changes of its related item as values', async () => {
		const changes = {
			create: [{ language: 'en-US', title: 'Prelude' }],
			update: [],
			delete: [],
		};

		const wrapper = mount(TestComponentM2A, {
			props: { relation: relationM2A, value: [], id: 1 },
		});

		await flushPromises();

		// "Add Existing" on an m2a stages the junction row in `create`
		wrapper.vm.select([5], 'text');

		await flushPromises();

		const selected = wrapper.vm.displayItems.find((item) => item.item?.id === 5)!;

		wrapper.vm.update({ ...selected, item: { id: 5, translations: changes } });

		await flushPromises();

		expect(wrapper.vm.displayItems.find((item) => item.item?.id === 5)!.item).toEqual({
			id: 5,
			text: 'lorem',
			translations: [{ language: 'en-US', title: 'Prelude' }],
		});

		expect(wrapper.vm.value).toEqual({
			create: [
				{
					article_id: 1,
					collection: 'text',
					item: { id: 5, translations: changes },
				},
			],
			update: [],
			delete: [],
		});
	});

	test('nested changes inside a junction field resolve for display and save as a delta', async () => {
		const changes = {
			create: [{ language: 'en-US', title: 'Prelude' }],
			update: [],
			delete: [],
		};

		const wrapper = mount(TestComponentM2A, {
			props: { relation: relationM2A, value: [], id: 1 },
		});

		await flushPromises();

		wrapper.vm.update({ id: 1, item: { id: 1, translations: changes } });

		await flushPromises();

		expect(wrapper.vm.displayItems[0]!.item).toEqual({
			id: 1,
			translations: [{ language: 'en-US', title: 'Prelude' }],
		});

		// Spreading the display item back in must not save the resolved values in place of the delta
		wrapper.vm.update({ ...wrapper.vm.displayItems[0], sort: 9 });

		await flushPromises();

		expect(wrapper.vm.value).toEqual({
			create: [],
			update: [{ id: 1, article_id: 1, collection: 'text', item: { id: 1, translations: changes }, sort: 9 }],
			delete: [],
		});
	});
});

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

const RefreshSignalProvider = defineComponent({
	props: ['relation', 'id'], // eslint-disable-line vue/require-prop-types
	setup() {
		const refreshSignal = ref(0);
		provideRefreshSignal(refreshSignal);
		return { refreshSignal };
	},
	render() {
		return h(TestComponent, { relation: this.relation, id: this.id, value: [] });
	},
});

describe('refresh signal', () => {
	function countFetches(spy: MockInstance<typeof sdk.request>) {
		return spy.mock.calls.filter((call) => {
			const request = (call[0] as () => { path: string; params?: Record<string, any> })();
			return request.path === '/items/worker' && !request.params?.aggregate;
		}).length;
	}

	test('refetches the rows when the provided signal is bumped', async () => {
		const sdkSpy = vi.spyOn(sdk, 'request');

		const wrapper = mount(RefreshSignalProvider, {
			props: { relation: relationO2M, id: 1 },
		});

		await flushPromises();

		expect(countFetches(sdkSpy)).toBe(1);

		wrapper.vm.refreshSignal++;

		await flushPromises();

		expect(countFetches(sdkSpy)).toBe(2);
		expect(wrapper.findComponent(TestComponent).vm.displayItems).toEqual(workerData);
	});

	test('does not refetch while the signal is unchanged', async () => {
		const sdkSpy = vi.spyOn(sdk, 'request');

		mount(RefreshSignalProvider, {
			props: { relation: relationO2M, id: 1 },
		});

		await flushPromises();
		await flushPromises();

		expect(countFetches(sdkSpy)).toBe(1);
	});
});

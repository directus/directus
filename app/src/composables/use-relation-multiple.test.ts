import { test, expect, vi, describe } from 'vitest';
import { computed, defineComponent, h, toRefs } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import { RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';
import { useSync } from '@directus/shared/composables';
import { RelationO2M } from './use-relation-o2m';
import { cloneDeep } from 'lodash';

vi.mock('@/utils/unexpected-error', () => {
	return {
		unexpectedError: (error: any) => {
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
	props: ['value', 'relation', 'id'], // eslint-disable-line  vue/require-prop-types
	emits: ['update:value'],
	setup(props, { emit }) {
		const value = useSync(props, 'value', emit);
		const { relation, id } = toRefs(props);

		const query = computed<RelationQueryMultiple>(() => {
			const q: RelationQueryMultiple = {
				limit: 15,
				page: 1,
				fields: ['id'],
			};

			return q;
		});

		return useRelationMultiple(value, query, relation, id);
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
	vi.mock('@/api', () => {
		return {
			default: {
				get: (path: string, { params }: { params: Record<string, any> }) => {
					if (path === '/items/worker' && params?.aggregate?.count === 'id') {
						return Promise.resolve({
							data: {
								data: [{ count: { id: workerData.length } }],
							},
						});
					}

					return Promise.resolve({
						data: {
							data: workerData,
						},
					});
				},
			},
		};
	});

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
		expect(wrapper.emitted()['update:value'][0]).toEqual([
			{
				create: [
					{
						name: 'test5',
						facility: 1,
					},
				],
				update: [],
				delete: [],
			},
		]);
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
		expect(wrapper.emitted()['update:value'][1]).toEqual([
			{
				create: [
					{
						name: 'test5 edited',
						facility: 2,
					},
				],
				update: [],
				delete: [],
			},
		]);
	});

	test('removing a created item', async () => {
		const wrapper = mount(TestComponent, {
			props: { relation: relationO2M, value: [], id: 1 },
		});

		wrapper.vm.create({ name: 'test5', facility: 1 });

		wrapper.vm.remove({ name: 'test5', facility: 1, $type: 'created', $index: 0 });

		await flushPromises();

		expect(wrapper.vm.displayItems).toEqual(workerData);

		expect(wrapper.emitted()['update:value'][1]).toEqual([undefined]);
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
		expect(wrapper.emitted()['update:value'][0]).toEqual([
			{
				create: [],
				update: [
					{
						id: 2,
						name: 'test2-edited',
					},
				],
				delete: [],
			},
		]);
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
		expect(wrapper.emitted()['update:value'][0]).toEqual([{ create: [], update: [], delete: [2] }]);
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
		expect(wrapper.emitted()['update:value'][2]).toEqual([
			{
				create: [],
				update: [
					{
						id: 2,
						name: 'test2-edited',
					},
				],
				delete: [1, 2],
			},
		]);
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
});

import type { RequestOptions } from '@directus/sdk';
import { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { pick } from 'lodash';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import NestedDraggable from './NestedDraggable.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { RelationO2M } from '@/composables/use-relation-o2m';
import { i18n } from '@/lang';
import { Collection } from '@/types/collections';

const pages: Record<string, any>[] = [
	{ id: 1, title: 'A', parent: null },
	{ id: 2, title: 'B', parent: 1 },
];

vi.mock('@/sdk', async () => {
	const { mockSdk } = await import('@/test-utils/sdk');

	return mockSdk(({ path, params }: RequestOptions) => {
		const parent = params?.filter?._and?.[0]?.parent;
		const children = pages.filter((page) => page.parent === parent);

		if (path === '/items/page' && params?.aggregate?.count === 'id') {
			return Promise.resolve([{ count: { id: children.length } }]);
		}

		// Only the requested fields come back, as with the real endpoint
		const fields: string[] = params?.fields ?? [];

		return Promise.resolve(children.map((page) => pick(page, fields)));
	});
});

// Cut the drawer and preview import chains, which reach the item route and its collaboration setup
vi.mock('@/views/private/components/drawer-item.vue', () => ({
	default: { name: 'DrawerItem', template: '<div />' },
}));

vi.mock('@/views/private/components/drawer-collection.vue', () => ({
	default: { name: 'DrawerCollection', template: '<div />' },
}));

vi.mock('./item-preview.vue', () => ({
	default: {
		name: 'ItemPreview',
		props: ['item', 'open'],
		emits: ['update:open', 'input', 'deselect'],
		template: '<div class="item-preview">{{ item.title }}</div>',
	},
}));

vi.mock('@/utils/fetch-all', () => ({
	fetchAll: () => Promise.resolve([]),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: (error: unknown) => {
		throw error;
	},
}));

// Self-referential tree: `children` on a page relates back to pages
vi.mock('@/utils/get-related-collection', () => ({
	getRelatedCollection: (collection: string, field: string) =>
		collection === 'page' && field === 'children' ? { relatedCollection: 'page' } : null,
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getPrimaryKeyFieldForCollection: () => ({ field: 'id' }),
	}),
}));

const relationInfo: RelationO2M = {
	relatedCollection: { collection: 'page' } as Collection,
	relatedPrimaryKeyField: { field: 'id' } as Field,
	reverseJunctionField: { field: 'parent' } as Field,
	relation: {
		collection: 'page',
		field: 'parent',
		related_collection: 'page',
		meta: null,
		schema: null,
	} as Relation,
	type: 'o2m',
};

const global: GlobalMountOptions = {
	stubs: {
		VSkeletonLoader: true,
		VNotice: true,
		VButton: true,
		DrawerItem: true,
		DrawerCollection: true,
		VListItem: { template: '<div class="v-list-item"><slot /></div>' },
		ItemPreview: {
			name: 'ItemPreview',
			props: ['item', 'open'],
			emits: ['update:open', 'input', 'deselect'],
			template: '<div class="item-preview">{{ item.title }}</div>',
		},
		Draggable: {
			props: ['modelValue'],
			template:
				'<div><slot v-for="(element, index) in modelValue" name="item" :element="element" :index="index" /></div>',
		},
	},
	plugins: [i18n, createTestingPinia({ createSpy: vi.fn })],
};

const Host = defineComponent({
	components: { NestedDraggable },
	setup() {
		return { value: ref<any>(undefined), relationInfo };
	},
	template: `
		<NestedDraggable
			v-model="value"
			collection="page"
			field="children"
			:primary-key="1"
			:version="null"
			template="{{ title }}"
			:fields="['id', 'title']"
			:relation-info="relationInfo"
			root
			:enable-create="true"
			:enable-select="false"
			:custom-filter="{}"
			:items-moved="[]"
		/>
	`,
});

async function mountExpandedTree() {
	const wrapper = mount(Host, { global });

	await flushPromises();

	// Expand the saved child row so the nested level renders
	await wrapper.findAllComponents({ name: 'ItemPreview' })[0]!.vm.$emit('update:open', true);
	await flushPromises();

	return wrapper;
}

const grandChild = { title: 'B1', parent: 2 };
const secondGrandChild = { title: 'B2', parent: 2 };

describe('nested levels of the tree', () => {
	test('passes the staged changes down instead of the values resolved for display', async () => {
		const wrapper = await mountExpandedTree();

		const changes = { create: [grandChild], update: [], delete: [] };

		const nested = wrapper.findAllComponents(NestedDraggable)[1]!;
		await nested.vm.$emit('update:modelValue', changes);
		await flushPromises();

		expect(wrapper.findAllComponents(NestedDraggable)[1]!.props('modelValue')).toEqual(changes);
	});

	test('renders a newly staged nested item', async () => {
		const wrapper = await mountExpandedTree();

		const nested = wrapper.findAllComponents(NestedDraggable)[1]!;
		await nested.vm.$emit('update:modelValue', { create: [grandChild], update: [], delete: [] });
		await flushPromises();

		const titles = wrapper.findAllComponents({ name: 'ItemPreview' }).map((preview) => preview.props('item').title);

		expect(titles).toEqual(['B', 'B1']);
	});

	test('keeps earlier nested items when another one is staged', async () => {
		const wrapper = await mountExpandedTree();

		const nested = wrapper.findAllComponents(NestedDraggable)[1]!;

		await nested.vm.$emit('update:modelValue', { create: [grandChild], update: [], delete: [] });
		await flushPromises();

		// The nested level stages its second item on top of the first
		await nested.vm.$emit('update:modelValue', { create: [grandChild, secondGrandChild], update: [], delete: [] });
		await flushPromises();

		expect(wrapper.vm.value).toEqual({
			create: [],
			update: [
				{
					id: 2,
					title: 'B',
					children: { create: [grandChild, secondGrandChild], update: [], delete: [] },
				},
			],
			delete: [],
		});
	});
});

import { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import ListM2A from './list-m2a.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { Collection } from '@/types/collections';

const INACTIVE_COLLECTION = 'comments';

vi.mock('@/composables/use-relation-m2a', () => ({
	useRelationM2A: () => ({
		relationInfo: computed(() => ({
			allowedCollections: [{ collection: 'headings' } as Collection],
			relationPrimaryKeyFields: {
				headings: { field: 'id' } as Field,
				[INACTIVE_COLLECTION]: { field: 'id' } as Field,
			},
			collectionField: { field: 'collection' } as Field,
			junctionCollection: { collection: 'junction-collection' } as Collection,
			junctionPrimaryKeyField: { field: 'id' } as Field,
			junctionField: { field: 'item' } as Field,
			reverseJunctionField: { field: 'article_id' } as Field,
			junction: {} as Relation,
			relation: {} as Relation,
			sortField: 'sort',
			type: 'm2a',
		})),
	}),
}));

vi.mock('@/composables/use-relation-permissions', () => ({
	useRelationPermissionsM2A: () => ({
		createAllowed: computed(() => ({})),
		selectAllowed: computed(() => ({})),
		updateAllowed: computed(() => true),
		deleteAllowed: computed(() => ({})),
	}),
}));

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: () => ({
		getCollection: (key: string) => ({
			collection: key,
			meta: { status: key === 'comments' ? 'inactive' : 'active' },
		}),
	}),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getFieldsForCollection: vi.fn(() => []),
		getField: vi.fn(() => null),
		getPrimaryKeyFieldForCollection: vi.fn(() => ({ field: 'id' })),
	}),
}));

/** Junction rows 1-3, where the middle one belongs to a deactivated collection */
const displayItems = [
	{ id: 'a', collection: 'headings', item: { id: '10' }, sort: 1, $type: undefined, $index: 0, $edits: undefined },
	{
		id: 'b',
		collection: INACTIVE_COLLECTION,
		item: { id: '20' },
		sort: 2,
		$type: undefined,
		$index: 1,
		$edits: undefined,
	},
	{ id: 'c', collection: 'headings', item: { id: '30' }, sort: 3, $type: undefined, $index: 2, $edits: undefined },
];

const mockUpdate = vi.hoisted(() => vi.fn());

vi.mock('@/composables/use-relation-multiple', () => ({
	useRelationMultiple: () => ({
		create: vi.fn(),
		update: mockUpdate,
		remove: vi.fn(),
		select: vi.fn(),
		displayItems: ref(displayItems),
		totalItemCount: ref(displayItems.length),
		loading: ref(false),
		selected: ref([]),
		isItemSelected: vi.fn(() => false),
		isLocalItem: vi.fn(() => false),
		getItemEdits: vi.fn(() => ({})),
	}),
}));

afterEach(() => {
	vi.clearAllMocks();
});

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
		VListItem: { template: '<div class="v-list-item"><slot /></div>' },
		VNotice: true,
		VRemove: true,
		VSkeletonLoader: true,
		VButton: true,
		VPagination: true,
		VSelect: true,
		VMenu: true,
		DrawerCollection: true,
		DrawerItem: true,
		RenderTemplate: true,
		Draggable: {
			name: 'Draggable',
			template: '<div />',
			props: ['modelValue'],
			emits: ['update:modelValue'],
		},
	},
	directives: {
		tooltip: () => {},
		'prevent-focusout': () => {},
	},
	plugins: [i18n, createTestingPinia({ createSpy: vi.fn })],
};

function mountList() {
	return mount(ListM2A, {
		props: {
			primaryKey: '1',
			collection: 'articles',
			field: 'sections',
			version: null,
		},
		global,
	});
}

describe('sorting with hidden inactive items', () => {
	it('only offers the active items for dragging', () => {
		const wrapper = mountList();

		const draggable = wrapper.findComponent({ name: 'Draggable' });

		expect(draggable.props('modelValue').map((item: any) => item.id)).toEqual(['a', 'c']);
	});

	it('keeps hidden items in their slot so sort positions stay unique', async () => {
		const wrapper = mountList();

		const draggable = wrapper.findComponent({ name: 'Draggable' });

		// User drags 'c' above 'a'; the hidden 'b' is not part of the emitted list
		await draggable.vm.$emit('update:modelValue', [displayItems[2], displayItems[0]]);

		expect(mockUpdate).toHaveBeenCalledTimes(1);

		const sorts = (mockUpdate.mock.calls[0] ?? []).map((change: any) => ({ id: change.id, sort: change.sort }));

		// 'b' holds slot 2 throughout, so the visible items take 1 and 3 rather than colliding on 2
		expect(sorts).toEqual([
			{ id: 'c', sort: 1 },
			{ id: 'b', sort: 2 },
			{ id: 'a', sort: 3 },
		]);
	});
});

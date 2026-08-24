import { shallowMount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, ref, unref } from 'vue';
import VFieldList from './v-field-list.vue';

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: () => ({
		getCollection: vi.fn(() => null),
	}),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getFieldGroupChildren: vi.fn(() => []),
		getFieldsForCollection: vi.fn(() => []),
	}),
}));

vi.mock('@/stores/relations', () => ({
	useRelationsStore: () => ({
		getRelationsForCollection: vi.fn(() => []),
	}),
}));

vi.mock('@/composables/use-fake-version-field', () => ({
	useFakeVersionField: () => ({
		fakeVersionField: ref(null),
	}),
}));

vi.mock('@/composables/use-field-tree', () => ({
	useFieldTree: (collection: unknown, _injectFields: unknown, filter: (field: any) => boolean) => {
		const collectionName = unref(collection) as string;

		const fields = [
			{ field: 'id', key: 'id', type: 'uuid', name: 'ID', collection: collectionName, group: false },
			{
				field: '$thumbnail',
				key: '$thumbnail',
				type: 'string',
				name: 'Thumbnail',
				collection: collectionName,
				group: false,
			},
		];

		return {
			treeList: ref(fields.filter((field) => filter(field))),
			loadFieldRelations: vi.fn(),
			refresh: vi.fn(),
		};
	},
}));

const VFieldListItemStub = defineComponent({
	name: 'VFieldListItem',
	props: {
		field: {
			type: Object,
			required: true,
		},
	},
	template: '<div class="v-field-list-item-stub" />',
});

const VListStub = defineComponent({
	name: 'VList',
	template: '<div class="v-list-stub"><slot /></div>',
});

function mountComponent(props: Record<string, unknown> = {}) {
	return shallowMount(VFieldList, {
		props: {
			collection: 'directus_files',
			...props,
		},
		global: {
			mocks: {
				$t: (value: string) => value,
			},
			stubs: {
				VFieldListItem: VFieldListItemStub,
				VList: VListStub,
			},
		},
	});
}

describe('v-field-list fieldFilter', () => {
	test('filters out virtual fields when fieldFilter is provided', () => {
		const wrapper = mountComponent({
			fieldFilter: (field: { field: string }) => field.field.startsWith('$') === false,
		});

		const renderedFields = wrapper
			.findAllComponents(VFieldListItemStub)
			.map((componentWrapper) => componentWrapper.props('field') as { field: string });

		expect(renderedFields.map((field) => field.field)).toEqual(['id']);
	});

	test('keeps existing behavior when fieldFilter is omitted', () => {
		const wrapper = mountComponent();

		const renderedFields = wrapper
			.findAllComponents(VFieldListItemStub)
			.map((componentWrapper) => componentWrapper.props('field') as { field: string });

		expect(renderedFields.map((field) => field.field)).toEqual(['id', '$thumbnail']);
	});
});

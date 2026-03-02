import { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import ListO2M from './list-o2m.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { Collection } from '@/types/collections';
import { LAYOUTS } from '@/types/interfaces';

vi.mock('@/composables/use-relation-o2m', () => ({
	useRelationO2M: () => ({
		relationInfo: computed(() => ({
			relation: {
				collection: 'related-collection',
				field: 'parent_id',
				related_collection: 'test-collection',
				schema: null,
				meta: null,
			} as Relation,
			relatedCollection: {
				collection: 'related-collection',
			} as Collection,
			relatedPrimaryKeyField: { field: 'id' } as Field,
			reverseJunctionField: { field: 'parent_id' } as Field,
			type: 'o2m',
		})),
	}),
}));

vi.mock('@/composables/use-relation-permissions', () => ({
	useRelationPermissionsO2M: () => ({
		createAllowed: computed(() => true),
		updateAllowed: computed(() => true),
		deleteAllowed: computed(() => true),
	}),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getFieldsForCollection: vi.fn(() => []),
		getField: vi.fn(() => null),
		getPrimaryKeyFieldForCollection: vi.fn(() => ({ field: 'id' })),
	}),
}));

vi.mock('@/composables/use-relation-multiple', () => ({
	useRelationMultiple: () => ({
		create: vi.fn(),
		update: vi.fn(),
		remove: vi.fn(),
		select: vi.fn(),
		displayItems: ref([{ id: '1', $type: 'existingItem', $index: 0, $edits: 0 }]),
		totalItemCount: ref(1),
		loading: ref(false),
		selected: ref([]),
		fetchedSelectItems: ref([]),
		fetchedItems: ref([]),
		useActions: vi.fn(() => ({
			cleanItem: vi.fn((item: any) => item),
			getPage: vi.fn(),
			isLocalItem: vi.fn(() => false),
			getItemEdits: vi.fn(() => 0),
			isEmpty: vi.fn(() => false),
		})),
		cleanItem: vi.fn((item: any) => item),
		isItemSelected: vi.fn(() => false),
		isLocalItem: vi.fn(() => false),
		getItemEdits: vi.fn(() => 0),
	}),
}));

afterEach(() => {
	vi.clearAllMocks();
});

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
		VListItem: {
			template: '<div class="v-list-item"><slot /></div>',
		},
		VNotice: true,
		VRemove: true,
		VSkeletonLoader: true,
		VButton: true,
		VPagination: true,
		VSelect: true,
		VTable: true,
		DrawerBatch: true,
		DrawerCollection: true,
		DrawerItem: true,
		RenderTemplate: true,
		RouterLink: true,
		SearchInput: true,
		Draggable: {
			template: '<div><slot v-for="element in modelValue" name="item" :element="element" /></div>',
			props: ['modelValue'],
		},
	},
	directives: {
		tooltip: () => {},
		'prevent-focusout': () => {},
	},
	plugins: [
		i18n,
		createTestingPinia({
			createSpy: vi.fn,
		}),
	],
};

const routerLinkStub = {
	template: '<div class="router-link-stub"><slot v-bind="{ href: \'/test\', navigate: () => {} }" /></div>',
};

const globalWithRouterLink: GlobalMountOptions = {
	...global,
	stubs: { ...global.stubs, RouterLink: routerLinkStub },
};

const tableGlobal: GlobalMountOptions = {
	...global,
	stubs: {
		...global.stubs,
		VTable: {
			template: '<div class="v-table"><slot v-for="item in items" name="item-append" :item="item" /></div>',
			props: ['items'],
		},
	},
};

const tableGlobalWithRouterLink: GlobalMountOptions = {
	...tableGlobal,
	stubs: { ...tableGlobal.stubs, RouterLink: routerLinkStub },
};

const listProps = {
	primaryKey: '1',
	collection: 'test-collection',
	field: 'test-field',
	width: 'full',
	version: null,
};

describe('list-o2m', () => {
	it('should mount', () => {
		const wrapper = mount(ListO2M, {
			props: listProps,
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	describe('list layout', () => {
		describe('non-editable state', () => {
			it('should show item-actions with navigate link when nonEditable and enableLink are true', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, enableLink: true, nonEditable: true, disabled: true },
					global,
				});

				expect(wrapper.find('.item-actions').exists()).toBe(true);
				expect(wrapper.find('.item-actions router-link-stub').exists()).toBe(true);
			});

			it('should hide item-actions when nonEditable is true and enableLink is false', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, enableLink: false, nonEditable: true, disabled: true },
					global,
				});

				expect(wrapper.find('.item-actions').exists()).toBe(false);
			});

			it('should hide remove button when nonEditable is true', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, enableLink: true, nonEditable: true, disabled: true },
					global,
				});

				expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(false);
			});

			it('should render clickable navigate link when nonEditable and disabled are both true', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, enableLink: true, nonEditable: true, disabled: true },
					global: globalWithRouterLink,
				});

				expect(wrapper.find('.item-actions .item-link').exists()).toBe(true);
			});

			it('should render non-clickable icon when disabled is true and nonEditable is false', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, enableLink: true, nonEditable: false, disabled: true },
					global: globalWithRouterLink,
				});

				expect(wrapper.find('.item-actions .item-link').exists()).toBe(false);
			});
		});

		describe('disabled state', () => {
			it('should render action buttons disabled when disabled is true', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, disabled: true },
					global,
				});

				expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(true);
				expect(wrapper.find('.item-actions v-remove-stub').attributes('disabled')).toBe('true');
			});
		});

		describe('editable state', () => {
			it('should show remove button when nonEditable is false', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, enableLink: true, nonEditable: false, disabled: false },
					global,
				});

				expect(wrapper.find('.item-actions').exists()).toBe(true);
				expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(true);
			});
		});
	});

	describe('table layout', () => {
		describe('non-editable state', () => {
			it('should show item-actions with navigate link when nonEditable and enableLink are true', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, layout: LAYOUTS.TABLE, enableLink: true, nonEditable: true, disabled: true },
					global: tableGlobal,
				});

				expect(wrapper.find('.item-actions').exists()).toBe(true);
				expect(wrapper.find('.item-actions router-link-stub').exists()).toBe(true);
			});

			it('should hide remove button when nonEditable is true', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, layout: LAYOUTS.TABLE, enableLink: true, nonEditable: true, disabled: true },
					global: tableGlobal,
				});

				expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(false);
			});

			it('should render clickable navigate link when nonEditable and disabled are both true', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, layout: LAYOUTS.TABLE, enableLink: true, nonEditable: true, disabled: true },
					global: tableGlobalWithRouterLink,
				});

				expect(wrapper.find('.item-actions .item-link').exists()).toBe(true);
			});

			it('should render non-clickable icon when disabled is true and nonEditable is false', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, layout: LAYOUTS.TABLE, enableLink: true, nonEditable: false, disabled: true },
					global: tableGlobalWithRouterLink,
				});

				expect(wrapper.find('.item-actions .item-link').exists()).toBe(false);
			});
		});

		describe('disabled state', () => {
			it('should render action buttons disabled when disabled is true', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, layout: LAYOUTS.TABLE, disabled: true },
					global: tableGlobal,
				});

				expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(true);
				expect(wrapper.find('.item-actions v-remove-stub').attributes('disabled')).toBe('true');
			});
		});

		describe('editable state', () => {
			it('should show remove button when nonEditable is false', () => {
				const wrapper = mount(ListO2M, {
					props: { ...listProps, layout: LAYOUTS.TABLE, enableLink: true, nonEditable: false, disabled: false },
					global: tableGlobal,
				});

				expect(wrapper.find('.item-actions').exists()).toBe(true);
				expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(true);
			});
		});
	});
});

import { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, type Ref } from 'vue';
import SelectDropdownM2O from './select-dropdown-m2o.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { Collection } from '@/types/collections';

vi.mock('@/composables/use-relation-m2o', () => ({
	useRelationM2O: () => ({
		relationInfo: computed(() => ({
			relation: {
				collection: 'test-collection',
				field: 'test-field',
				related_collection: 'related-collection',
				schema: null,
				meta: null,
			} as Relation,
			relatedCollection: {
				collection: 'related-collection',
			} as Collection,
			relatedPrimaryKeyField: { field: 'id' } as Field,
			type: 'm2o',
		})),
	}),
}));

vi.mock('@/composables/use-relation-permissions', () => ({
	useRelationPermissionsM2O: () => ({
		createAllowed: vi.fn(() => true),
	}),
}));

vi.mock('@/composables/use-relation-single', () => ({
	useRelationSingle: (value: Ref<number | string | Record<string, any> | null>) => ({
		update: vi.fn(),
		remove: vi.fn(),
		displayItem: computed(() => (value.value ? { id: '1' } : null)),
		loading: computed(() => false),
	}),
}));

afterEach(() => {
	vi.clearAllMocks();
});

const global: GlobalMountOptions = {
	config: {
		compilerOptions: {
			isCustomElement: (tag) => tag === 'v-list-item-stub',
		},
	},
	stubs: {
		VIcon: true,
		VListItem: {
			template: '<v-list-item-stub @click="$emit(\'click\', $event)"><slot /></v-list-item-stub>',
		},
		VNotice: true,
		VRemove: true,
		VSkeletonLoader: true,
		DrawerCollection: true,
		DrawerItem: true,
		RenderTemplate: true,
		RouterLink: true,
	},
	directives: {
		tooltip: () => {},
	},
	plugins: [
		i18n,
		createTestingPinia({
			createSpy: vi.fn,
		}),
	],
};

describe('Interface', () => {
	it('should mount', () => {
		const wrapper = mount(SelectDropdownM2O, {
			props: {
				value: '1',
				collection: 'test-collection',
				field: 'test-field',
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render action buttons disabled when disabled is true', () => {
		const wrapper = mount(SelectDropdownM2O, {
			props: {
				collection: 'test-collection',
				field: 'test-field',
				enableLink: true,
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.many-to-one v-list-item-stub').attributes('disabled')).toBe('true');
		expect(wrapper.find('.item-actions v-icon-stub.add').attributes('disabled')).toBe('true');
	});

	it('should hide action buttons when nonEditable is true and enableLink is false', () => {
		const wrapper = mount(SelectDropdownM2O, {
			props: {
				value: '1',
				collection: 'test-collection',
				field: 'test-field',
				enableLink: false,
				nonEditable: true,
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.item-actions').exists()).toBe(false);
	});

	it('should show item-actions with navigate link when nonEditable is true and enableLink is true', () => {
		const wrapper = mount(SelectDropdownM2O, {
			props: {
				value: '1',
				collection: 'test-collection',
				field: 'test-field',
				enableLink: true,
				nonEditable: true,
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.item-actions').exists()).toBe(true);
		expect(wrapper.find('.item-actions router-link-stub').exists()).toBe(true);
	});

	it('should hide edit and remove controls when nonEditable is true', () => {
		const wrapper = mount(SelectDropdownM2O, {
			props: {
				value: '1',
				collection: 'test-collection',
				field: 'test-field',
				enableLink: true,
				nonEditable: true,
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.item-actions').exists()).toBe(true);
		expect(wrapper.find('.item-actions v-icon-stub[name="edit"]').exists()).toBe(false);
		expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(false);
	});

	it('should show edit and remove controls when nonEditable is false', () => {
		const wrapper = mount(SelectDropdownM2O, {
			props: {
				value: '1',
				collection: 'test-collection',
				field: 'test-field',
				enableLink: true,
				nonEditable: false,
				disabled: false,
			},
			global,
		});

		expect(wrapper.find('.item-actions').exists()).toBe(true);
		expect(wrapper.find('.item-actions v-icon-stub[name="edit"]').exists()).toBe(true);
		expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(true);
	});

	it('should render clickable navigate link when nonEditable and disabled are both true', () => {
		const globalWithRouterLink: GlobalMountOptions = {
			...global,
			stubs: {
				...global.stubs,
				RouterLink: {
					template: '<div class="router-link-stub"><slot v-bind="{ href: \'/test\', navigate: () => {} }" /></div>',
				},
			},
		};

		const wrapper = mount(SelectDropdownM2O, {
			props: {
				value: '1',
				collection: 'test-collection',
				field: 'test-field',
				enableLink: true,
				nonEditable: true,
				disabled: true,
			},
			global: globalWithRouterLink,
		});

		expect(wrapper.find('.item-actions .item-link').exists()).toBe(true);
	});

	it('should render non-clickable icon when disabled is true and nonEditable is false', () => {
		const globalWithRouterLink: GlobalMountOptions = {
			...global,
			stubs: {
				...global.stubs,
				RouterLink: {
					template: '<div class="router-link-stub"><slot v-bind="{ href: \'/test\', navigate: () => {} }" /></div>',
				},
			},
		};

		const wrapper = mount(SelectDropdownM2O, {
			props: {
				value: '1',
				collection: 'test-collection',
				field: 'test-field',
				enableLink: true,
				nonEditable: false,
				disabled: true,
			},
			global: globalWithRouterLink,
		});

		expect(wrapper.find('.item-actions .item-link').exists()).toBe(false);
	});

	describe('on click', () => {
		it('should open the select modal', async () => {
			const wrapper = mount(SelectDropdownM2O, {
				props: {
					value: '1',
					collection: 'test-collection',
					field: 'test-field',
				},
				global,
			});

			expect((wrapper.vm as any).selectModalActive).toBe(false);

			await wrapper.find('.many-to-one v-list-item-stub').trigger('click');
			expect((wrapper.vm as any).selectModalActive).toBe(true);
		});

		it('should open the edit modal when enableSelect is false', async () => {
			const wrapper = mount(SelectDropdownM2O, {
				props: {
					value: '1',
					collection: 'test-collection',
					field: 'test-field',
					enableSelect: false,
				},
				global,
			});

			expect((wrapper.vm as any).editModalActive).toBe(false);

			await wrapper.find('.many-to-one v-list-item-stub').trigger('click');
			expect((wrapper.vm as any).editModalActive).toBe(true);
		});

		it('should open the edit modal when nonEditable is true', async () => {
			const wrapper = mount(SelectDropdownM2O, {
				props: {
					value: '1',
					collection: 'test-collection',
					field: 'test-field',
					nonEditable: true,
					// Note: if nonEditable is true, disabled prop will also be true
					disabled: true,
				},
				global,
			});

			expect((wrapper.vm as any).editModalActive).toBe(false);

			await wrapper.find('.many-to-one v-list-item-stub').trigger('click');
			expect((wrapper.vm as any).editModalActive).toBe(true);
		});
	});
});

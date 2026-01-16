import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CollectionItemMultipleDropdown from './collection-item-multiple-dropdown.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import api from '@/api';
import { i18n } from '@/lang';

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: () => ({
		getCollection: vi.fn(() => ({})),
	}),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getPrimaryKeyFieldForCollection: vi.fn(() => ({ field: 'id' })),
		getField: vi.fn(() => ({ field: 'id' })),
	}),
}));

afterEach(() => {
	vi.clearAllMocks();
});

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
		VRemove: true,
		VButton: true,
		VListItem: { template: '<v-list-item-stub><slot /></v-list-item-stub>' },
		VSkeletonLoader: true,
		DrawerCollection: true,
		RenderTemplate: true,
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
		const wrapper = mount(CollectionItemMultipleDropdown, {
			props: {
				selectedCollection: 'test-collection',
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render action buttons', async () => {
		vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [{ id: '1', title: 'Hello' }] } });

		const wrapper = mount(CollectionItemMultipleDropdown, {
			props: {
				selectedCollection: 'test-collection',
				value: [{ key: '1', collection: 'test-collection' }],
			},
			global,
		});

		expect(wrapper.find('.actions').exists()).toBe(true);

		await flushPromises();

		expect(wrapper.find('v-list-item-stub .drag-handle').exists()).toBe(true);
		expect(wrapper.find('v-list-item-stub .item-actions').exists()).toBe(true);
	});

	it('should render action buttons disabled when disabled is true', async () => {
		vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [{ id: '1', title: 'Hello' }] } });

		const wrapper = mount(CollectionItemMultipleDropdown, {
			props: {
				selectedCollection: 'test-collection',
				disabled: true,
				value: [{ key: '1', collection: 'test-collection' }],
			},
			global,
		});

		expect(wrapper.find('.actions v-button-stub').attributes('disabled')).toBe('true');

		await flushPromises();

		expect(wrapper.find('v-list-item-stub .drag-handle').attributes('disabled')).toBe('true');
		expect(wrapper.find('v-list-item-stub .item-actions v-remove-stub').attributes('disabled')).toBe('true');
	});

	it('should hide action buttons when nonEditable is true', async () => {
		vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [{ id: '1', title: 'Hello' }] } });

		const wrapper = mount(CollectionItemMultipleDropdown, {
			props: {
				selectedCollection: 'test-collection',
				nonEditable: true,
				// Note: if nonEditable is true, disabled prop will also be true
				disabled: true,
				value: [{ key: '1', collection: 'test-collection' }],
			},
			global,
		});

		await flushPromises();

		expect(wrapper.find('.actions').exists()).toBe(false);
		expect(wrapper.find('v-list-item-stub .drag-handle').exists()).toBe(false);
		expect(wrapper.find('v-list-item-stub .item-actions').exists()).toBe(false);
	});
});

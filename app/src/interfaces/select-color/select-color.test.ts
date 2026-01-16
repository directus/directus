import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import SelectColor from './select-color.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	stubs: {
		VButton: true,
		VIcon: true,
		VRemove: true,
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
		const wrapper = mount(SelectColor, {
			props: {
				value: null,
				width: 'half',
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render icon when null', () => {
		const wrapper = mount(SelectColor, {
			props: {
				value: null,
				width: 'half',
			},
			global,
		});

		expect(wrapper.find('.item-actions v-icon-stub').attributes('name')).toBe('palette');
	});

	it('should render remove button when value is set', () => {
		const wrapper = mount(SelectColor, {
			props: {
				value: '#6644FF',
				width: 'half',
			},
			global,
		});

		expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(true);
	});

	it('should mount', () => {
		const wrapper = mount(SelectColor, {
			props: {
				value: '#6644FF',
				width: 'half',
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render action buttons disabled when disabled is true', () => {
		const wrapper = mount(SelectColor, {
			props: {
				value: '#6644FF',
				width: 'half',
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.item-actions v-remove-stub').attributes('disabled')).toBe('true');
	});

	it('should hide action buttons when nonEditable is true', () => {
		const wrapper = mount(SelectColor, {
			props: {
				value: '#6644FF',
				width: 'half',
				nonEditable: true,
				// Note: if nonEditable is true, disabled prop will also be true
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(false);
	});
});

import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import SelectIcon from './select-icon.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	stubs: {
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
		const wrapper = mount(SelectIcon, {
			props: {
				value: null,
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render icon when null', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: null,
			},
			global,
		});

		expect(wrapper.find('.item-actions v-icon-stub').attributes('name')).toBe('expand_more');
	});

	it('should render remove button when value is set', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: 'launch',
			},
			global,
		});

		expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(true);
	});

	it('should mount', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: 'launch',
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render action buttons disabled when disabled is true', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: 'launch',
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.item-actions v-remove-stub').attributes('disabled')).toBe('true');
		expect(wrapper.find('.v-input .input input').attributes('disabled')).toBe('');
	});

	it('should hide action buttons when nonEditable is true', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: 'launch',
				nonEditable: true,
				// Note: if nonEditable is true, disabled prop will also be true
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(false);
	});
});

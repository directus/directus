import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SelectRadio from './select-radio.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import VRadio from '@/components/v-radio.vue';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	stubs: {
		VRadio,
		VIcon: true,
	},
	plugins: [i18n],
};

describe('Interface', () => {
	const choices = [
		{ value: '1', text: 'Item 1' },
		{ value: '2', text: 'Item 2' },
		{ value: '3', text: 'Item 3' },
		{ value: '4', text: 'Item 4' },
	];

	it('should mount', () => {
		const wrapper = mount(SelectRadio, {
			props: {
				value: null,
				choices,
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render all choices', () => {
		const wrapper = mount(SelectRadio, {
			props: {
				value: null,
				choices,
			},
			global,
		});

		expect(wrapper.findAll('.v-radio').length).toBe(4);
	});

	it('should render other choices when allowOther is true', () => {
		const wrapper = mount(SelectRadio, {
			props: {
				value: 'other-value',
				choices,
				allowOther: true,
			},
			global,
		});

		expect(wrapper.find('.custom.has-value').exists()).toBe(true);
		expect(wrapper.find('v-icon-stub.radio-icon').exists()).toBe(true);
	});

	it('should render action buttons disabled when disabled is true', () => {
		const wrapper = mount(SelectRadio, {
			props: {
				value: 'other-value',
				choices,
				allowOther: true,
				disabled: true,
			},
			global,
		});

		const radios = wrapper.findAll('button.v-radio');

		radios.forEach((radio) => {
			expect(radio.attributes('disabled')).toBe('');
		});

		expect(wrapper.find('.custom.has-value.disabled input').attributes('disabled')).toBe('');
	});

	it('should not render custom input when not set and nonEditable is true', () => {
		const wrapper = mount(SelectRadio, {
			props: {
				value: null,
				choices,
				allowOther: true,
				nonEditable: true,
				// Note: if nonEditable is true, disabled prop will also be true
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.custom').exists()).toBe(false);
	});
});

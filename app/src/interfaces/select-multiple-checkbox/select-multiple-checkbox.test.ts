import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SelectMultipleCheckbox from './select-multiple-checkbox.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import VCheckbox from '@/components/v-checkbox.vue';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	stubs: {
		VCheckbox,
		VIcon: true,
		VDetail: true,
	},
	directives: {
		tooltip: () => {},
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
		const wrapper = mount(SelectMultipleCheckbox, {
			props: {
				value: null,
				choices,
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should hide items that exceed the itemsShown limit', async () => {
		const wrapper = mount(SelectMultipleCheckbox, {
			props: {
				value: null,
				choices,
				itemsShown: 2,
			},
			global,
		});

		expect(wrapper.findAll('.v-checkbox').length).toBe(2);
	});

	it('should show items that exceed the itemsShown limit when nonEditable is true', async () => {
		const wrapper = mount(SelectMultipleCheckbox, {
			props: {
				value: null,
				choices,
				itemsShown: 2,
				nonEditable: true,
				// Note: if nonEditable is true, disabled prop will also be true
				disabled: true,
			},
			global,
		});

		expect(wrapper.findAll('.v-checkbox').length).toBe(4);
	});

	it('should render other choices when allowOther is true', () => {
		const wrapper = mount(SelectMultipleCheckbox, {
			props: {
				value: ['other', 'another'],
				choices,
				allowOther: true,
			},
			global,
		});

		expect(wrapper.findAll('.v-checkbox').length).toBe(6);
	});

	it('should render "add new" button and delete buttons when allowOther is true', () => {
		const wrapper = mount(SelectMultipleCheckbox, {
			props: {
				value: ['other', 'another'],
				choices,
				allowOther: true,
			},
			global,
		});

		expect(wrapper.find('button.add-new').exists()).toBe(true);
		expect(wrapper.findAll('.v-checkbox v-icon-stub[name="delete"]').length).toBe(2);
	});

	it('should render action buttons disabled when disabled is true', async () => {
		const wrapper = mount(SelectMultipleCheckbox, {
			props: {
				value: ['other', 'another'],
				choices,
				allowOther: true,
				disabled: true,
			},
			global,
		});

		const checkboxes = wrapper.findAll('button.v-checkbox');

		checkboxes.forEach((checkbox) => {
			expect(checkbox.attributes('disabled')).toBe('');
		});
	});

	it('should not render action buttons when nonEditable is true', async () => {
		const wrapper = mount(SelectMultipleCheckbox, {
			props: {
				value: ['other', 'another'],
				choices,
				allowOther: true,
				nonEditable: true,
				// Note: if nonEditable is true, disabled prop will also be true
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('button.add-new').exists()).toBe(false);
		expect(wrapper.findAll('.v-checkbox v-icon-stub[name="delete"]').length).toBe(0);
	});
});

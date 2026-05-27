import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import DisplayBoolean from './boolean.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const global: GlobalMountOptions = {
	stubs: ['v-icon', 'value-null'],
};

test('Mount component', () => {
	expect(DisplayBoolean).toBeTruthy();

	const wrapper = mount(DisplayBoolean, {
		props: {
			value: true,
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

describe('null value handling', () => {
	test('renders ValueNull when value is null', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: null,
			},
			global,
		});

		expect(wrapper.find('value-null-stub').exists()).toBe(true);
	});
});

describe('icon rendering', () => {
	test('renders check icon for true value by default', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: true,
			},
			global,
		});

		const icon = wrapper.find('v-icon-stub');
		expect(icon.exists()).toBe(true);
		expect(icon.attributes('name')).toBe('check');
	});

	test('renders close icon for false value by default', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: false,
			},
			global,
		});

		const icon = wrapper.find('v-icon-stub');
		expect(icon.exists()).toBe(true);
		expect(icon.attributes('name')).toBe('close');
	});

	test('renders custom iconOn when value is true', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: true,
				iconOn: 'thumb_up',
			},
			global,
		});

		const icon = wrapper.find('v-icon-stub');
		expect(icon.attributes('name')).toBe('thumb_up');
	});

	test('renders custom iconOff when value is false', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: false,
				iconOff: 'thumb_down',
			},
			global,
		});

		const icon = wrapper.find('v-icon-stub');
		expect(icon.attributes('name')).toBe('thumb_down');
	});

	test('does not render icon when iconOn and iconOff are null', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: true,
				iconOn: null,
				iconOff: null,
			},
			global,
		});

		expect(wrapper.find('v-icon-stub').exists()).toBe(false);
	});
});

describe('label rendering', () => {
	test('does not render label by default', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: true,
			},
			global,
		});

		expect(wrapper.find('span').exists()).toBe(false);
	});

	test('renders labelOn when value is true and labels are provided', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: true,
				labelOn: 'Yes',
				labelOff: 'No',
			},
			global,
		});

		expect(wrapper.find('span').exists()).toBe(true);
		expect(wrapper.find('span').text()).toBe('Yes');
	});

	test('renders labelOff when value is false and labels are provided', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: false,
				labelOn: 'Yes',
				labelOff: 'No',
			},
			global,
		});

		expect(wrapper.find('span').text()).toBe('No');
	});

	test('does not render label when only labelOn is provided', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: true,
				labelOn: 'Yes',
			},
			global,
		});

		expect(wrapper.find('span').exists()).toBe(false);
	});
});

describe('color styling', () => {
	test('applies colorOn when value is true', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: true,
				colorOn: '#00FF00',
				colorOff: '#FF0000',
			},
			global,
		});

		const style = wrapper.find('.boolean').attributes('style');
		expect(style).toContain('color: #00FF00');
		expect(style).toContain('--v-icon-color: #00FF00');
	});

	test('applies colorOff when value is false', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: false,
				colorOn: '#00FF00',
				colorOff: '#FF0000',
			},
			global,
		});

		const style = wrapper.find('.boolean').attributes('style');
		expect(style).toContain('color: #FF0000');
		expect(style).toContain('--v-icon-color: #FF0000');
	});

	test('uses default colors when not specified', () => {
		const wrapper = mount(DisplayBoolean, {
			props: {
				value: true,
			},
			global,
		});

		const style = wrapper.find('.boolean').attributes('style');
		expect(style).toContain('var(--theme--primary)');
	});
});

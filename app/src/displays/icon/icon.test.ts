import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import DisplayIcon from './icon.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
};

test('Mount component', () => {
	expect(DisplayIcon).toBeTruthy();

	const wrapper = mount(DisplayIcon, {
		props: {
			value: 'star',
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('renders icon with value prop', () => {
	const wrapper = mount(DisplayIcon, {
		props: {
			value: 'check',
		},
		global,
	});

	const icon = wrapper.find('v-icon-stub');
	expect(icon.exists()).toBe(true);
	expect(icon.attributes('name')).toBe('check');
});

test('renders icon with null value', () => {
	const wrapper = mount(DisplayIcon, {
		props: {
			value: null,
		},
		global,
	});

	const icon = wrapper.find('v-icon-stub');
	expect(icon.exists()).toBe(true);
	// null value is passed through to v-icon
	expect(icon.attributes('name')).toBeUndefined();
});

test('applies color style when valid hex color is provided', () => {
	const wrapper = mount(DisplayIcon, {
		props: {
			value: 'star',
			color: '#FF0000',
		},
		global,
	});

	const icon = wrapper.find('v-icon-stub');
	expect(icon.attributes('style')).toContain('--v-icon-color: #FF0000');
});

test('does not apply color style when color is not a valid hex', () => {
	const wrapper = mount(DisplayIcon, {
		props: {
			value: 'star',
			color: 'red',
		},
		global,
	});

	const icon = wrapper.find('v-icon-stub');
	expect(icon.attributes('style')).toBeUndefined();
});

test('passes filled prop to v-icon', () => {
	const wrapper = mount(DisplayIcon, {
		props: {
			value: 'star',
			filled: true,
		},
		global,
	});

	const icon = wrapper.find('v-icon-stub');
	expect(icon.attributes('filled')).toBe('true');
});

test('passes small prop to v-icon', () => {
	const wrapper = mount(DisplayIcon, {
		props: {
			value: 'star',
		},
		global,
	});

	const icon = wrapper.find('v-icon-stub');
	expect(icon.attributes('small')).toBe('true');
});

test('handles lowercase hex color', () => {
	const wrapper = mount(DisplayIcon, {
		props: {
			value: 'star',
			color: '#ff0000',
		},
		global,
	});

	const icon = wrapper.find('v-icon-stub');
	expect(icon.attributes('style')).toContain('--v-icon-color: #ff0000');
});

test('handles 3-digit hex color', () => {
	const wrapper = mount(DisplayIcon, {
		props: {
			value: 'star',
			color: '#F00',
		},
		global,
	});

	const icon = wrapper.find('v-icon-stub');
	expect(icon.attributes('style')).toContain('--v-icon-color: #F00');
});

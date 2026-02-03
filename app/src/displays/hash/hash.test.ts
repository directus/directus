import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import DisplayHash from './hash.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const global: GlobalMountOptions = {
	stubs: ['value-null'],
};

test('Mount component', () => {
	expect(DisplayHash).toBeTruthy();

	const wrapper = mount(DisplayHash, {
		props: {
			value: 'hashed-password',
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('renders masked value when value is provided', () => {
	const wrapper = mount(DisplayHash, {
		props: {
			value: 'some-hashed-value',
		},
		global,
	});

	expect(wrapper.text()).toBe('**********');
	expect(wrapper.find('value-null-stub').exists()).toBe(false);
});

test('renders ValueNull component when value is null', () => {
	const wrapper = mount(DisplayHash, {
		props: {
			value: null,
		},
		global,
	});

	expect(wrapper.find('value-null-stub').exists()).toBe(true);
	expect(wrapper.find('div').exists()).toBe(false);
});

test('renders ValueNull when value prop is not provided (defaults to null)', () => {
	const wrapper = mount(DisplayHash, {
		global,
	});

	expect(wrapper.find('value-null-stub').exists()).toBe(true);
});

test('renders masked value for empty string', () => {
	const wrapper = mount(DisplayHash, {
		props: {
			value: '',
		},
		global,
	});

	expect(wrapper.text()).toBe('**********');
});

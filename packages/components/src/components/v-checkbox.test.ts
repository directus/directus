import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VSwitch from './v-switch.vue';
import { h } from 'vue';

test('Mount component', () => {
	expect(VSwitch).toBeTruthy();

	const wrapper = mount(VSwitch, {
		slots: {
			default: h('div', 'Hi'),
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('modelValue prop', async () => {
	const wrapper = mount(VSwitch, {
		props: {
			modelValue: true,
		},
	});

	expect(wrapper.attributes()['aria-pressed']).toBe('true');

	await wrapper.get('.switch').trigger('click');

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual([false]);
});

test('value prop', async () => {
	const wrapper = mount(VSwitch, {
		props: {
			value: 'test',
			modelValue: ['test', 'test2'],
		},
	});

	expect(wrapper.attributes()['aria-pressed']).toBe('true');

	await wrapper.get('.switch').trigger('click');

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual([['test2']]);
});

test('disabled prop', async () => {
	const wrapper = mount(VSwitch, {
		props: {
			disabled: true,
			modelValue: true,
		},
	});

	await wrapper.get('.switch').trigger('click');

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual([true]);
});

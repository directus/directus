import type { GlobalMountOptions } from '@/__utils__/types';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import { h } from 'vue';
import VCheckbox from './v-checkbox.vue';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
};

test('Mount component', () => {
	expect(VCheckbox).toBeTruthy();

	const wrapper = mount(VCheckbox, {
		slots: {
			default: h('div', 'Hi'),
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('modelValue prop', async () => {
	const wrapper = mount(VCheckbox, {
		props: {
			modelValue: true,
		},
		global,
	});

	expect(wrapper.attributes()['aria-pressed']).toBe('true');

	await wrapper.get('.checkbox').trigger('click');

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual([false]);
});

test('value prop', async () => {
	const wrapper = mount(VCheckbox, {
		props: {
			value: 'test',
			modelValue: ['test', 'test2'],
		},
		global,
	});

	expect(wrapper.attributes()['aria-pressed']).toBe('true');

	await wrapper.get('.checkbox').trigger('click');

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual([['test2']]);
});

test('label prop', async () => {
	const wrapper = mount(VCheckbox, {
		props: {
			label: 'my label',
		},
		global,
	});

	expect(wrapper.html()).toContain('my label');
});

test('customValue prop', async () => {
	const wrapper = mount(VCheckbox, {
		props: {
			customValue: true,
		},
		global,
	});

	wrapper.find('input').setValue('my custom value');

	expect(wrapper.emitted()['update:value']?.[0]).toEqual(['my custom value']);
});

test('disabled prop', async () => {
	const wrapper = mount(VCheckbox, {
		props: {
			disabled: true,
			modelValue: true,
		},
		global,
	});

	await wrapper.get('.checkbox').trigger('click');

	expect(wrapper.emitted()['update:modelValue']).not.toBeDefined();
});

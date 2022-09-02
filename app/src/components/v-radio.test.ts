import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VRadio from './v-radio.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
};

test('Mount component', () => {
	expect(VRadio).toBeTruthy();

	const wrapper = mount(VRadio, {
		props: {
			value: 'test',
			label: 'My Label',
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('modelValue prop', async () => {
	const wrapper = mount(VRadio, {
		props: {
			value: 'test',
			modelValue: 'test',
		},
		global,
	});

	expect(wrapper.classes()).toContain('checked');

	await wrapper.get('.label').trigger('click');

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['test']);

	await wrapper.setProps({ modelValue: null });

	expect(wrapper.classes()).not.toContain('checked');
});

import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import VRadio from './v-radio.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

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

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['test']);

	await wrapper.setProps({ modelValue: null });

	expect(wrapper.classes()).not.toContain('checked');
});

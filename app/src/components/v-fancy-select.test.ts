import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VFancySelect from './v-fancy-select.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';

const global: GlobalMountOptions = {
	stubs: ['v-icon', 'v-divider'],
};

const items = [
	{
		icon: 'person',
		value: 'person',
		text: 'Person',
	},
	{
		icon: 'directions_car',
		value: 'car',
		text: 'Car',
	},
	{
		divider: true,
	},
	{
		icon: 'home',
		value: 'home',
		text: 'Home',
		description: 'A home is a nice place',
	},
];

test('Mount component', () => {
	expect(VFancySelect).toBeTruthy();

	const wrapper = mount(VFancySelect, {
		props: {
			items,
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('modelValue prop', async () => {
	const wrapper = mount(VFancySelect, {
		props: {
			items,
		},
		global,
	});

	expect(wrapper.element.children[0].children.length).toBe(4);

	await wrapper.setProps({ modelValue: 'car' });

	expect(wrapper.element.children[0].children.length).toBe(1);
});

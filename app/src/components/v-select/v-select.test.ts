import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VSelect from './v-select.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { createI18n } from 'vue-i18n';
import { Focus } from '@/__utils__/focus';

const i18n = createI18n({ legacy: false });
const global: GlobalMountOptions = {
	stubs: [
		'v-list',
		'v-list-item',
		'v-list-item-icon',
		'v-list-item-content',
		'v-divider',
		'v-checkbox',
		'v-menu',
		'v-icon',
		'v-input',
	],
	plugins: [i18n],
	directives: {
		Focus,
	},
};

const items = [
	{
		text: 'Item 1',
		value: 'item1',
	},
	{
		text: 'Item 2',
		value: 'item2',
	},
	{
		text: 'Item 3',
		value: 'item3',
	},
];

test('Mount component', () => {
	expect(VSelect).toBeTruthy();

	const wrapper = mount(VSelect, {
		props: {
			items,
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

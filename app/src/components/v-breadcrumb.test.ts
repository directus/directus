import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VBreadcrumb from './v-breadcrumb.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';

const global: GlobalMountOptions = {
	stubs: ['v-icon', 'router-link'],
};

test('Mount component', () => {
	expect(VBreadcrumb).toBeTruthy();

	const wrapper = mount(VBreadcrumb, {
		props: {
			items: [
				{
					to: 'hi',
					name: 'Hi',
				},
				{
					to: 'wow',
					name: 'Wow',
					icon: 'close',
				},
				{
					to: 'disabled',
					name: 'Disabled',
					disabled: true,
				},
			],
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

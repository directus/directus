import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import VBreadcrumb from './v-breadcrumb.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

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

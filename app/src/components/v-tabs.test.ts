import VTabs from './v-tabs.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';

const global: GlobalMountOptions = {
	stubs: ['v-tabs-items', 'v-list'],
};

test('Mount component', () => {
	expect(VTabs).toBeTruthy();

	const wrapper = mount(VTabs, {
		slots: {
			default: 'Some value',
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

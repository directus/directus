import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VTabs from './v-tabs.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';

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

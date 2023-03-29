import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VIconFile from './v-icon-file.vue';

test('Mount component', () => {
	expect(VIconFile).toBeTruthy();

	const wrapper = mount(VIconFile, {
		props: {
			ext: 'png',
		},
		global: {
			stubs: ['v-icon'],
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VTextOverflow from './v-text-overflow.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { Tooltip } from '@/__utils__/tooltip';

const global: GlobalMountOptions = {
	stubs: ['v-icon', 'v-highlight'],
	directives: {
		Tooltip,
	},
};

test('Mount component', () => {
	expect(VTextOverflow).toBeTruthy();

	const wrapper = mount(VTextOverflow, {
		props: {
			text: 'My text',
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('highlight prop', () => {
	const wrapper = mount(VTextOverflow, {
		props: {
			text: 'my Text',
			highlight: 'text',
		},
		global,
	});

	expect(wrapper.getComponent({ name: 'v-highlight' }).attributes().query).toBe('text');
	expect(wrapper.getComponent({ name: 'v-highlight' }).attributes().text).toBe('my Text');
});

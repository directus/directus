import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VInfo from './v-info.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
};

test('Mount component', () => {
	expect(VInfo).toBeTruthy();

	const wrapper = mount(VInfo, {
		props: {
			title: 'This is an info',
		},
		slots: {
			default: 'content',
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('stlye props', async () => {
	const types = ['info', 'success', 'warning', 'danger', 'center'];

	for (const type of types) {
		const wrapper = mount(VInfo, {
			props: {
				title: 'This is an info',
				type,
			},
			global,
		});

		expect(wrapper.classes()).toContain(type);
	}
});

test('icon prop', async () => {
	const wrapper = mount(VInfo, {
		props: {
			title: 'This is an info',
			icon: 'close',
		},
		global,
	});

	expect(wrapper.getComponent({ name: 'v-icon' }).attributes().name).toBe('close');
});

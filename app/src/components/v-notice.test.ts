import type { GlobalMountOptions } from '@/__utils__/types';
import { mount } from '@vue/test-utils';
import { zip } from 'lodash';
import { expect, test } from 'vitest';
import VNotice from './v-notice.vue';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
};

test('Mount component', () => {
	expect(VNotice).toBeTruthy();

	const wrapper = mount(VNotice, {
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('type prop', async () => {
	const types = ['info', 'success', 'warning', 'danger'];

	for (const type of types) {
		const wrapper = mount(VNotice, {
			props: {
				type,
			},
			global,
		});

		expect(wrapper.classes()).toContain(type);
	}
});

test('icon prop', async () => {
	const types = ['info', 'success', 'warning', 'danger'];
	const icons = ['info', 'check_circle', 'warning', 'error'];

	for (const [type, icon] of zip(types, icons)) {
		const wrapper = mount(VNotice, {
			props: {
				type,
				icon: true,
			},
			global,
		});

		expect(wrapper.getComponent('v-icon-stub').attributes().name).toBe(icon);
	}

	const wrapper = mount(VNotice, {
		props: {
			icon: 'my-icon',
		},
		global,
	});

	expect(wrapper.getComponent('v-icon-stub').attributes().name).toBe('my-icon');
});

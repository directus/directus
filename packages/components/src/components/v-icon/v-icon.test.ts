import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VIcon from './v-icon.vue';

test('Mount component', () => {
	expect(VIcon).toBeTruthy();

	const wrapper = mount(VIcon, {
		props: {
			name: 'close',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('style props', () => {
	const props = ['x-small', 'small', 'large', 'x-large', 'left', 'right'];

	for (const prop of props) {
		const wrapper = mount(VIcon, {
			props: {
				name: 'close',
				[prop]: true,
			},
		});

		expect(wrapper.classes()).toContain(prop);
	}
});

test('custom icon', () => {
	const wrapper = mount(VIcon, {
		props: {
			name: 'directus',
		},
	});

	expect(wrapper.find('svg').exists()).toBeTruthy();
});

test('social icon', () => {
	const wrapper = mount(VIcon, {
		props: {
			name: 'docker',
		},
	});

	expect(wrapper.find('svg').exists()).toBeTruthy();
});

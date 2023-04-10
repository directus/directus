import { test, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { library } from '@fortawesome/fontawesome-svg-core';

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
			name: 'signal_wifi_3_bar',
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

test('should only load fontawesome brand icons when using social icon', () => {
	const libraryAddSpy = vi.spyOn(library, 'add');

	mount(VIcon, {
		props: {
			name: 'close', // non-social icon
		},
	});

	expect(libraryAddSpy).not.toHaveBeenCalled();

	mount(VIcon, {
		props: {
			name: 'vuejs', // social icon
		},
	});

	expect(libraryAddSpy).toHaveBeenCalledOnce();
});

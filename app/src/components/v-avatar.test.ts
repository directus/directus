import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VAvatar from './v-avatar.vue';

test('Mount component', () => {
	expect(VAvatar).toBeTruthy();

	const wrapper = mount(VAvatar, {
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('tile prop', () => {
	const wrapper = mount(VAvatar, {
		props: {
			tile: true,
		},
	});

	expect(wrapper.classes()).toContain('tile');
});

test('small prop', () => {
	const wrapper = mount(VAvatar, {
		props: {
			small: true,
		},
	});

	expect(wrapper.classes()).toContain('small');
});

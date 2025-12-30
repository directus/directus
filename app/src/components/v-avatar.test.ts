import VAvatar from './v-avatar.vue';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';


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

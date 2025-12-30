import VOverlay from './v-overlay.vue';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';


test('Mount component', () => {
	expect(VOverlay).toBeTruthy();

	const wrapper = mount(VOverlay, {
		props: {
			active: true,
		},
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('absolute prop', () => {
	const wrapper = mount(VOverlay, {
		props: {
			absolute: true,
		},
	});

	expect(wrapper.classes()).toContain('absolute');
});

test('clickable prop', () => {
	const wrapper = mount(VOverlay, {
		props: {
			clickable: true,
		},
	});

	expect(wrapper.classes()).toContain('has-click');
});

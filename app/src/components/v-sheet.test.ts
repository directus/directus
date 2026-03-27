import { mount } from '@vue/test-utils';
import { expect, test } from 'vite-plus/test';
import VSheet from './v-sheet.vue';

test('Mount component', () => {
	expect(VSheet).toBeTruthy();

	const wrapper = mount(VSheet, {
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

import { mount } from '@vue/test-utils';
import { expect, test } from 'vite-plus/test';
import VCardTitle from './v-card-title.vue';

test('Mount component', () => {
	expect(VCardTitle).toBeTruthy();

	const wrapper = mount(VCardTitle, {
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

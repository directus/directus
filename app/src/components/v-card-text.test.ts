import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import VCardText from './v-card-text.vue';

test('Mount component', () => {
	expect(VCardText).toBeTruthy();

	const wrapper = mount(VCardText, {
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

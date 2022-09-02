import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

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

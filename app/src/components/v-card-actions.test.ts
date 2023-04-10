import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VCardActions from './v-card-actions.vue';

test('Mount component', () => {
	expect(VCardActions).toBeTruthy();

	const wrapper = mount(VCardActions, {
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

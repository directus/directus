import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VCardSubtitle from './v-card-subtitle.vue';

test('Mount component', () => {
	expect(VCardSubtitle).toBeTruthy();

	const wrapper = mount(VCardSubtitle, {
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

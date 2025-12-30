import VCardActions from './v-card-actions.vue';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';

test('Mount component', () => {
	expect(VCardActions).toBeTruthy();

	const wrapper = mount(VCardActions, {
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

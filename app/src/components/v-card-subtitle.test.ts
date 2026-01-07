import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
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

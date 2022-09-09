import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VHighlight from './v-highlight.vue';

test('Mount component', () => {
	expect(VHighlight).toBeTruthy();

	const wrapper = mount(VHighlight, {
		props: {
			text: 'This is a nice text',
			query: ['is', 'text'],
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('query prop', async () => {
	const wrapper = mount(VHighlight, {
		props: {
			text: 'This is a nice text',
			query: 'nice',
		},
	});

	expect(wrapper.find('.highlight').exists()).toBeTruthy();
	expect(wrapper.find('.highlight').text()).toBe('nice');
});

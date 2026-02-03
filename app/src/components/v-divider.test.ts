import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import VDivider from './v-divider.vue';

test('Mount component', () => {
	expect(VDivider).toBeTruthy();

	const wrapper = mount(VDivider, {
		slots: {
			default: 'Default slot',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('style props', async () => {
	const props = ['vertical', 'inlineTitle', 'large'];

	for (const prop of props) {
		const wrapper = mount(VDivider, {
			props: {
				[prop]: true,
			},
		});

		expect(wrapper.classes()).toContain(prop);
	}
});

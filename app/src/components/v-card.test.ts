import VCard from './v-card.vue';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';


test('Mount component', () => {
	expect(VCard).toBeTruthy();

	const wrapper = mount(VCard, {
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('style props', () => {
	const props = ['disabled', 'tile'];

	for (const prop of props) {
		const wrapper = mount(VCard, {
			props: {
				[prop]: true,
			},
		});

		expect(wrapper.classes()).toContain(prop);
	}
});

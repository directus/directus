import VProgressCircular from './v-progress-circular.vue';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';


test('Mount component', () => {
	expect(VProgressCircular).toBeTruthy();

	const wrapper = mount(VProgressCircular, {
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('size props', () => {
	const props = ['x-small', 'small', 'large', 'x-large'];

	for (const prop of props) {
		const wrapper = mount(VProgressCircular, {
			props: {
				[prop]: true,
			},
		});

		expect(wrapper.classes()).toContain(prop);
	}
});

test('indeterminate prop', () => {
	const wrapper = mount(VProgressCircular, {
		props: {
			indeterminate: true,
		},
	});

	expect(wrapper.get('.circle').classes()).toContain('indeterminate');
});

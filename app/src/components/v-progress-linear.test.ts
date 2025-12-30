import VProgressLinear from './v-progress-linear.vue';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';


test('Mount component', () => {
	expect(VProgressLinear).toBeTruthy();

	const wrapper = mount(VProgressLinear, {
		slots: {
			default: 'Slot Content',
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('style props', () => {
	const props = ['absolute', 'bottom', 'fixed', 'indeterminate', 'rounded', 'top', 'colorful'];

	for (const prop of props) {
		const wrapper = mount(VProgressLinear, {
			props: {
				[prop]: true,
			},
		});

		expect(wrapper.classes()).toContain(prop);
	}
});

import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import InterfaceBoolean from './boolean.vue';
import { i18n } from '@/lang';

const global = {
	plugins: [i18n],
	stubs: { VIcon: true },
};

test('renders a checkbox by default', () => {
	const wrapper = mount(InterfaceBoolean, {
		props: { value: false },
		global,
	});

	expect(wrapper.find('[role="checkbox"]').exists()).toBe(true);
	expect(wrapper.find('[role="switch"]').exists()).toBe(false);
});

test('renders a switch that emits the toggled value', async () => {
	const wrapper = mount(InterfaceBoolean, {
		props: { value: false, control: 'switch', label: 'Enable Versioning' },
		global,
	});

	const toggle = wrapper.get('[role="switch"]');

	expect(toggle.text()).toBe('Enable Versioning');

	await toggle.trigger('click');

	expect(wrapper.emitted('input')?.[0]).toEqual([true]);
});

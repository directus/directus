import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import VSwitch from './v-switch.vue';

test('Mount component', () => {
	expect(VSwitch).toBeTruthy();

	const wrapper = mount(VSwitch, {
		props: { label: 'Enable' },
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('exposes switch role and checked state', () => {
	const wrapper = mount(VSwitch, {
		props: { modelValue: true },
	});

	expect(wrapper.attributes('role')).toBe('switch');
	expect(wrapper.attributes('aria-checked')).toBe('true');
});

test('treats null as unchecked', () => {
	const wrapper = mount(VSwitch);

	expect(wrapper.attributes('aria-checked')).toBe('false');
	expect(wrapper.classes()).not.toContain('checked');
});

test('emits the toggled value on click', async () => {
	const wrapper = mount(VSwitch, {
		props: { modelValue: false },
	});

	await wrapper.trigger('click');

	expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
});

test('does not emit when disabled', async () => {
	const wrapper = mount(VSwitch, {
		props: { modelValue: false, disabled: true },
	});

	await wrapper.trigger('click');

	expect(wrapper.emitted('update:modelValue')).toBeUndefined();
});

test('renders label', () => {
	const wrapper = mount(VSwitch, {
		props: { label: 'Enable Versioning' },
	});

	expect(wrapper.get('.label').text()).toBe('Enable Versioning');
});

import { mount } from '@vue/test-utils';
import { expect, test, vi } from 'vitest';
import VKbd from './v-kbd.vue';

test('renders as kbd element by default', () => {
	const wrapper = mount(VKbd, {
		slots: { default: 'K' },
	});

	expect(wrapper.element.tagName).toBe('KBD');
});

test('renders translated value on non-mac', () => {
	vi.stubGlobal('navigator', { platform: 'Win32' });

	const wrapper = mount(VKbd, {
		props: { value: 'meta' },
	});

	expect(wrapper.text()).toBe('Ctrl');

	vi.unstubAllGlobals();
});

test('renders translated value on mac', () => {
	vi.stubGlobal('navigator', { platform: 'MacIntel' });

	const wrapper = mount(VKbd, {
		props: { value: 'meta' },
	});

	expect(wrapper.text()).toBe('⌘');

	vi.unstubAllGlobals();
});

test('slot takes precedence over value prop', () => {
	const wrapper = mount(VKbd, {
		props: { value: 'meta' },
		slots: { default: 'Custom' },
	});

	expect(wrapper.text()).toBe('Custom');
});

test('size prop adds correct class', () => {
	for (const size of ['small', 'medium', 'large'] as const) {
		const wrapper = mount(VKbd, { props: { size } });
		expect(wrapper.classes()).toContain(size);
	}
});

test('defaults to medium size', () => {
	const wrapper = mount(VKbd);
	expect(wrapper.classes()).toContain('medium');
});

test('variant prop adds correct class', () => {
	for (const variant of ['outlined', 'soft', 'inverted'] as const) {
		const wrapper = mount(VKbd, { props: { variant } });
		expect(wrapper.classes()).toContain(variant);
	}
});

test('defaults to soft variant', () => {
	const wrapper = mount(VKbd);
	expect(wrapper.classes()).toContain('soft');
});

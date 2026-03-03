import { mount } from '@vue/test-utils';
import { afterEach, expect, test, vi } from 'vitest';
import VHover from './v-hover.vue';

afterEach(() => {
	vi.useRealTimers();
});

test('Mount component', () => {
	expect(VHover).toBeTruthy();

	const wrapper = mount(VHover, {
		slots: {
			default: ({ hover }) => (hover ? 'shown' : 'hidden'),
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('hover interaction', async () => {
	const wrapper = mount(VHover, {
		slots: {
			default: ({ hover }) => (hover ? 'shown' : 'hidden'),
		},
	});

	vi.useFakeTimers();

	expect(wrapper.text()).toBe('hidden');
	await wrapper.trigger('mouseenter');
	await vi.advanceTimersByTime(1);
	expect(wrapper.text()).toBe('shown');
	await wrapper.trigger('mouseleave');
	await vi.advanceTimersByTime(1);
	expect(wrapper.text()).toBe('hidden');
});

test('openDelay prop', async () => {
	const wrapper = mount(VHover, {
		props: {
			openDelay: 20,
		},
		slots: {
			default: ({ hover }) => (hover ? 'shown' : 'hidden'),
		},
	});

	vi.useFakeTimers();

	expect(wrapper.text()).toBe('hidden');
	await wrapper.trigger('mouseenter');
	await vi.advanceTimersByTime(10);
	expect(wrapper.text()).toBe('hidden');
	await vi.advanceTimersByTime(10);
	expect(wrapper.text()).toBe('shown');
});

test('closeDelay prop', async () => {
	const wrapper = mount(VHover, {
		props: {
			closeDelay: 20,
		},
		slots: {
			default: ({ hover }) => (hover ? 'shown' : 'hidden'),
		},
	});

	vi.useFakeTimers();

	expect(wrapper.text()).toBe('hidden');
	await wrapper.trigger('mouseenter');
	await vi.advanceTimersByTime(1);
	expect(wrapper.text()).toBe('shown');
	await wrapper.trigger('mouseleave');
	await vi.advanceTimersByTime(10);
	expect(wrapper.text()).toBe('shown');
	await vi.advanceTimersByTime(10);
	expect(wrapper.text()).toBe('hidden');
});

test('tag prop', async () => {
	const wrapper = mount(VHover, {
		props: {
			tag: 'span',
		},
		slots: {
			default: ({ hover }) => (hover ? 'shown' : 'hidden'),
		},
	});

	expect(wrapper.element.tagName).toBe('SPAN');
});

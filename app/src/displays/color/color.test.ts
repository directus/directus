import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import DisplayColor from './color.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

vi.mock('@directus/utils/browser', () => ({
	cssVar: vi.fn(() => '#FFFFFF'),
}));

const global: GlobalMountOptions = {
	stubs: ['value-null'],
};

test('Mount component', () => {
	expect(DisplayColor).toBeTruthy();

	const wrapper = mount(DisplayColor, {
		props: {
			value: '#FF0000',
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

describe('null value handling', () => {
	test('renders ValueNull when value is null and defaultColor is null', () => {
		const wrapper = mount(DisplayColor, {
			props: {
				value: null,
				defaultColor: null,
			},
			global,
		});

		expect(wrapper.find('value-null-stub').exists()).toBe(true);
	});

	test('renders color dot when value is null but defaultColor is set', () => {
		const wrapper = mount(DisplayColor, {
			props: {
				value: null,
			},
			global,
		});

		expect(wrapper.find('value-null-stub').exists()).toBe(false);
		expect(wrapper.find('.dot').exists()).toBe(true);
	});
});

describe('color dot rendering', () => {
	test('renders color dot for valid hex color', () => {
		const wrapper = mount(DisplayColor, {
			props: {
				value: '#FF0000',
			},
			global,
		});

		expect(wrapper.find('.dot').exists()).toBe(true);
	});

	test('renders color dot with defaultColor when value is null', () => {
		const wrapper = mount(DisplayColor, {
			props: {
				value: null,
				defaultColor: '#00FF00',
			},
			global,
		});

		expect(wrapper.find('.dot').exists()).toBe(true);
	});
});

describe('border handling', () => {
	test('adds border class when color has low contrast with background', () => {
		const wrapper = mount(DisplayColor, {
			props: {
				value: '#FFFFFF',
			},
			global,
		});

		expect(wrapper.find('.dot').classes()).toContain('with-border');
	});

	test('does not add border class when color has high contrast with background', () => {
		const wrapper = mount(DisplayColor, {
			props: {
				value: '#000000',
			},
			global,
		});

		expect(wrapper.find('.dot').classes()).not.toContain('with-border');
	});

	test('does not add border when color is null', () => {
		const wrapper = mount(DisplayColor, {
			props: {
				value: null,
				defaultColor: null,
			},
			global,
		});

		expect(wrapper.find('.dot').classes()).not.toContain('with-border');
	});
});

describe('CSS variable colors', () => {
	test('renders color dot when value starts with var(--', () => {
		const wrapper = mount(DisplayColor, {
			props: {
				value: 'var(--theme--primary)',
			},
			global,
		});

		expect(wrapper.find('.dot').exists()).toBe(true);
	});

	test('accepts defaultColor with var(-- prefix', () => {
		const wrapper = mount(DisplayColor, {
			props: {
				value: null,
				defaultColor: 'var(--theme--primary)',
			},
			global,
		});

		expect(wrapper.find('.dot').exists()).toBe(true);
	});
});

describe('inline-flex container', () => {
	test('has color-dot class on root element', () => {
		const wrapper = mount(DisplayColor, {
			props: {
				value: '#FF0000',
			},
			global,
		});

		expect(wrapper.find('.color-dot').exists()).toBe(true);
	});
});

import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import DisplayRating from './rating.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
	directives: {
		tooltip: () => {},
	},
};

test('Mount component', () => {
	expect(DisplayRating).toBeTruthy();

	const wrapper = mount(DisplayRating, {
		props: {
			value: 3,
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

describe('simple mode', () => {
	test('renders simple rating with icon and value', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 4,
				simple: true,
			},
			global,
		});

		expect(wrapper.find('.rating.simple').exists()).toBe(true);
		expect(wrapper.find('v-icon-stub').exists()).toBe(true);
		expect(wrapper.text()).toContain('4');
	});

	test('renders star icon in simple mode', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 3,
				simple: true,
			},
			global,
		});

		const icon = wrapper.find('v-icon-stub');
		expect(icon.attributes('name')).toBe('star');
		expect(icon.attributes('filled')).toBe('true');
	});
});

describe('detailed mode', () => {
	test('renders detailed rating by default', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 3,
			},
			global,
		});

		expect(wrapper.find('.rating.detailed').exists()).toBe(true);
	});

	test('renders 5 stars by default', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 3,
			},
			global,
		});

		const activeIcons = wrapper.find('.active').findAll('v-icon-stub');
		const inactiveIcons = wrapper.find('.inactive').findAll('v-icon-stub');

		expect(activeIcons.length).toBe(5);
		expect(inactiveIcons.length).toBe(5);
	});

	test('has active and inactive star layers', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 3,
			},
			global,
		});

		expect(wrapper.find('.active').exists()).toBe(true);
		expect(wrapper.find('.inactive').exists()).toBe(true);
	});

	test('active stars are filled', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 3,
			},
			global,
		});

		const activeIcon = wrapper.find('.active v-icon-stub');
		expect(activeIcon.attributes('filled')).toBe('true');
	});

	test('inactive stars are not filled', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 3,
			},
			global,
		});

		const inactiveIcon = wrapper.find('.inactive v-icon-stub');
		// filled prop is explicitly false for inactive stars
		expect(inactiveIcon.attributes('filled')).toBe('false');
	});
});

describe('rating percentage calculation', () => {
	test('calculates correct percentage for value 3 out of 5', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 3,
			},
			global,
		});

		const activeDiv = wrapper.find('.active');
		expect(activeDiv.attributes('style')).toContain('60%');
	});

	test('calculates correct percentage for value 5 out of 5', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 5,
			},
			global,
		});

		const activeDiv = wrapper.find('.active');
		expect(activeDiv.attributes('style')).toContain('100%');
	});

	test('calculates correct percentage for value 0', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 0,
			},
			global,
		});

		const activeDiv = wrapper.find('.active');
		expect(activeDiv.attributes('style')).toContain('0%');
	});
});

describe('interfaceOptions', () => {
	test('respects custom maxValue from interfaceOptions', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 5,
				interfaceOptions: {
					minValue: 0,
					maxValue: 10,
					stepInterval: 1,
				},
			},
			global,
		});

		const activeIcons = wrapper.find('.active').findAll('v-icon-stub');
		expect(activeIcons.length).toBe(10);
	});

	test('calculates percentage based on custom maxValue', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 5,
				interfaceOptions: {
					minValue: 0,
					maxValue: 10,
					stepInterval: 1,
				},
			},
			global,
		});

		const activeDiv = wrapper.find('.active');
		expect(activeDiv.attributes('style')).toContain('50%');
	});

	test('defaults to 5 stars when interfaceOptions is null', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 3,
				interfaceOptions: null,
			},
			global,
		});

		const activeIcons = wrapper.find('.active').findAll('v-icon-stub');
		expect(activeIcons.length).toBe(5);
	});

	test('defaults to 5 stars when interfaceOptions is undefined', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: 3,
			},
			global,
		});

		const activeIcons = wrapper.find('.active').findAll('v-icon-stub');
		expect(activeIcons.length).toBe(5);
	});
});

describe('value types', () => {
	test('handles string value', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: '3',
			},
			global,
		});

		const activeDiv = wrapper.find('.active');
		expect(activeDiv.attributes('style')).toContain('60%');
	});

	test('handles null value', () => {
		const wrapper = mount(DisplayRating, {
			props: {
				value: null,
			},
			global,
		});

		const activeDiv = wrapper.find('.active');
		expect(activeDiv.attributes('style')).toContain('0%');
	});
});

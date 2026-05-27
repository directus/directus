import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InputHash from './input-hash.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import VInput from '@/components/v-input.vue';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
		VInput,
	},
	directives: {
		tooltip: () => {},
		focus: () => {},
	},
	plugins: [i18n],
};

describe('Interface', () => {
	it('should mount', () => {
		const wrapper = mount(InputHash, {
			props: {
				value: null,
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should be of type password when prop masked is true', () => {
		const wrapper = mount(InputHash, {
			props: {
				value: null,
				masked: true,
			},
			global,
		});

		expect(wrapper.find('input').attributes('type')).toBe('password');
		expect(wrapper.find('input').attributes('autocomplete')).toBe('new-password');
	});

	it('should set autocomplete to off even when prop masked is true', () => {
		const wrapper = mount(InputHash, {
			props: {
				value: null,
				masked: true,
				autocomplete: 'off',
			},
			global,
		});

		expect(wrapper.find('input').attributes('type')).toBe('password');
		expect(wrapper.find('input').attributes('autocomplete')).toBe('off');
	});
});

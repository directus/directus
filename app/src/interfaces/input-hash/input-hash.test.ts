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

	it('should not show the clear icon when there is no value', () => {
		const wrapper = mount(InputHash, {
			props: {
				value: null,
			},
			global,
		});

		expect(wrapper.find('[name="close"]').exists()).toBe(false);
	});

	it('should show the clear icon and emit null when a stored value is cleared', async () => {
		const wrapper = mount(InputHash, {
			props: {
				value: 'stored-secret',
			},
			global,
		});

		const clearIcon = wrapper.find('[name="close"]');
		expect(clearIcon.exists()).toBe(true);

		await clearIcon.trigger('click');

		expect(wrapper.emitted('input')).toEqual([[null]]);
	});

	it('should not show the clear icon when disabled', () => {
		const wrapper = mount(InputHash, {
			props: {
				value: 'stored-secret',
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('[name="close"]').exists()).toBe(false);
	});

	it('should reflect the hashed state once an entered value is persisted', async () => {
		const wrapper = mount(InputHash, {
			props: {
				value: null,
			},
			global,
		});

		// User types a value; the plaintext is held locally, so the field is not yet hashed.
		await wrapper.find('input').setValue('plaintext');
		expect(wrapper.find('.v-input').classes()).not.toContain('hashed');

		// Saving persists the value, so props.value becomes the stored hash.
		await wrapper.setProps({ value: 'stored-hash' });
		expect(wrapper.find('.v-input').classes()).toContain('hashed');
	});
});

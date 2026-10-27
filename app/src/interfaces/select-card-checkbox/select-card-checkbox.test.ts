import { mount, shallowMount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import SelectCardCheckbox from './select-card-checkbox.vue';
import { i18n } from '@/lang';

const global = {
	plugins: [i18n],
	renderStubDefaultSlot: true,
	stubs: {
		VNotice: { template: '<div class="notice"><slot /></div>' },
	},
};

describe('SelectCardCheckbox', () => {
	test('shows an empty state when no choices are configured', () => {
		const wrapper = shallowMount(SelectCardCheckbox, {
			props: { value: [], choices: [] },
			global,
		});

		expect(wrapper.find('.notice').text()).toBe('No options available');
	});
});

test('keeps selections when searching and follows external values', async () => {
	const wrapper = mount(SelectCardCheckbox, {
		props: {
			value: ['0'],
			choices: Array.from({ length: 11 }, (_, index) => ({ text: `Choice ${index}`, value: String(index) })),
		},
		global: {
			plugins: [i18n],
			stubs: {
				VIcon: true,
				VInput: {
					props: ['modelValue'],
					emits: ['update:modelValue'],
					template: `<input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
				},
				CardPreview: { props: ['choice', 'labelId'], template: '<span :id="labelId">{{ choice.text }}</span>' },
			},
		},
	});

	await wrapper.find('input').setValue('Choice 2');
	expect(wrapper.findAll('[role="checkbox"]')).toHaveLength(1);
	await wrapper.find('[role="checkbox"]').trigger('click');
	expect(wrapper.emitted('input')?.[0]).toEqual([['0', '2']]);
	await wrapper.setProps({ value: ['2'] });
	await wrapper.find('[role="checkbox"]').trigger('click');
	expect(wrapper.emitted('input')?.[1]).toEqual([[]]);
	await wrapper.setProps({ disabled: true });
	await wrapper.find('[role="checkbox"]').trigger('click');
	expect(wrapper.emitted('input')).toHaveLength(2);
});

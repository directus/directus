import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import SelectCardCheckbox from './select-card-checkbox.vue';
import { i18n } from '@/lang';

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
				VNotice: { template: '<div class="notice"><slot /></div>' },
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
	await wrapper.find('input').setValue('');
	await wrapper.setProps({ choices: [] });
	expect(wrapper.find('.notice').text()).toBe('No options available');
});

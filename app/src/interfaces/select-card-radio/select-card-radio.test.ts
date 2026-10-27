import { mount, shallowMount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import SelectCardRadio from './select-card-radio.vue';
import { i18n } from '@/lang';

const global = {
	plugins: [i18n],
	renderStubDefaultSlot: true,
	stubs: {
		VNotice: { template: '<div class="notice"><slot /></div>' },
	},
};

describe('SelectCardRadio', () => {
	test('shows an empty state when no choices are configured', () => {
		const wrapper = shallowMount(SelectCardRadio, {
			props: { value: null, choices: [] },
			global,
		});

		expect(wrapper.find('.notice').text()).toBe('No options available');
	});
});

test('selects numeric cards through VRadioCards and follows external resets', async () => {
	const wrapper = mount(SelectCardRadio, {
		props: {
			value: 0,
			choices: [
				{ text: 'Zero', value: 0 },
				{ text: 'One', value: 1 },
			],
		},
		global: {
			plugins: [i18n],
			stubs: {
				VIcon: true,
				VInput: true,
				CardPreview: { props: ['choice', 'labelId'], template: '<span :id="labelId">{{ choice.text }}</span>' },
			},
		},
	});

	const cards = wrapper.findAll('[role="radio"]');
	expect(cards[0]!.attributes('aria-checked')).toBe('true');
	await cards[1]!.trigger('click');
	expect(wrapper.emitted('input')?.[0]).toEqual([1]);
	await wrapper.setProps({ value: null });
	expect(cards.every((card) => card.attributes('aria-checked') === 'false')).toBe(true);
	await wrapper.setProps({ disabled: true });
	await cards[0]!.trigger('click');
	expect(wrapper.emitted('input')).toHaveLength(1);
});

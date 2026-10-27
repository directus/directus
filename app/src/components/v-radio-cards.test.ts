import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import type { ChoiceCardItem } from './v-choice-cards/types';
import VRadioCards from './v-radio-cards.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
};

const items: ChoiceCardItem[] = [
	{ value: 'core', label: "I'm using Core", description: 'Free, no key required', icon: 'deployed_code' },
	{ value: 'licensed', label: 'I have a license key', description: 'OIG, Team, or Enterprise plan', icon: 'key' },
];

test('Mount component', () => {
	expect(VRadioCards).toBeTruthy();

	const wrapper = mount(VRadioCards, {
		props: { items },
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('renders one card per item', () => {
	const wrapper = mount(VRadioCards, {
		props: { items },
		global,
	});

	expect(wrapper.findAll('.v-radio-card').length).toBe(items.length);
});

test('renders label and description', () => {
	const wrapper = mount(VRadioCards, {
		props: { items },
		global,
	});

	const cards = wrapper.findAll('.v-radio-card');

	expect(cards[0]!.find('.label').text()).toBe(items[0]!.label);
	expect(cards[0]!.find('.description').text()).toBe(items[0]!.description);
});

test('renders icon-box when item has icon', () => {
	const wrapper = mount(VRadioCards, {
		props: { items },
		global,
	});

	expect(wrapper.find('.icon-box').exists()).toBe(true);
});

test('does not render icon-box when item has no icon', () => {
	const wrapper = mount(VRadioCards, {
		props: { items: [{ value: 'a', label: 'A' }] },
		global,
	});

	expect(wrapper.find('.icon-box').exists()).toBe(false);
});

test('emits update:modelValue on card click', async () => {
	const wrapper = mount(VRadioCards, {
		props: { items },
		global,
	});

	await wrapper.findAll('.v-radio-card')[1]!.trigger('click');

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['licensed']);
});

test('disabled prop disables all cards', () => {
	const wrapper = mount(VRadioCards, {
		props: { items, disabled: true },
		global,
	});

	for (const card of wrapper.findAll('.v-radio-card')) {
		expect(card.attributes('disabled')).toBeDefined();
	}
});

test('item-level disabled disables only that card', () => {
	const mixedItems: ChoiceCardItem[] = [
		{ value: 'a', label: 'A', disabled: true },
		{ value: 'b', label: 'B' },
	];

	const wrapper = mount(VRadioCards, {
		props: { items: mixedItems },
		global,
	});

	const cards = wrapper.findAll('.v-radio-card');
	expect(cards[0]!.attributes('disabled')).toBeDefined();
	expect(cards[1]!.attributes('disabled')).toBeUndefined();
});

test('accepts numeric values', async () => {
	const numericItems: ChoiceCardItem[] = [
		{ value: 1, label: 'One' },
		{ value: 2, label: 'Two' },
	];

	const wrapper = mount(VRadioCards, {
		props: { items: numericItems },
		global,
	});

	await wrapper.findAll('.v-radio-card')[0]!.trigger('click');

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual([1]);
});

test('keeps numeric and string values distinct', async () => {
	const wrapper = mount(VRadioCards, {
		props: {
			items: [
				{ value: 0, label: 'Number' },
				{ value: '0', label: 'String' },
			],
			modelValue: 0,
		},
		global,
	});

	const cards = wrapper.findAll('[role="radio"]');
	expect(cards[0]!.attributes('aria-checked')).toBe('true');
	expect(cards[1]!.attributes('aria-checked')).toBe('false');
	await cards[1]!.trigger('click');
	expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['0']);
});

test('custom card content receives selection and accessible label IDs', async () => {
	const wrapper = mount(VRadioCards, {
		props: { items, modelValue: 'core' },
		global,
		slots: {
			item: `<template #item="{ item, selected, labelId, descriptionId }">
				<span :id="labelId">{{ item.label }}</span>
				<span :id="descriptionId">{{ item.description }}</span>
				<span class="selected">{{ selected }}</span>
			</template>`,
		},
	});

	const card = wrapper.find('[role="radio"]');
	expect(card.find('.selected').text()).toBe('true');
	expect(card.find(`[id="${card.attributes('aria-labelledby')}"]`).text()).toBe(items[0]!.label);
	expect(card.find(`[id="${card.attributes('aria-describedby')}"]`).text()).toBe(items[0]!.description);
	await wrapper.setProps({ modelValue: 'licensed' });
	expect(card.find('.selected').text()).toBe('false');
});

import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import VRadioCards, { type RadioCardItem } from './v-radio-cards.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
};

const items: RadioCardItem[] = [
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
	const mixedItems: RadioCardItem[] = [
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
	const numericItems: RadioCardItem[] = [
		{ value: 1, label: 'One' },
		{ value: 2, label: 'Two' },
	];

	const wrapper = mount(VRadioCards, {
		props: { items: numericItems },
		global,
	});

	await wrapper.findAll('.v-radio-card')[0]!.trigger('click');

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['1']);
});

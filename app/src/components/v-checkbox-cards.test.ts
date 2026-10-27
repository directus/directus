import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import { nextTick, reactive } from 'vue';
import VCheckboxCards from './v-checkbox-cards.vue';

const items = [
	{ value: 'a', label: 'Article', description: 'A written story', icon: 'article' },
	{ value: 'b', label: 'Video', description: 'A short film', icon: 'movie' },
];

const global = { stubs: ['v-icon'] };

test('toggles multiple cards without mutating the input array', async () => {
	const modelValue = ['a'];
	const wrapper = mount(VCheckboxCards, { props: { items, modelValue }, global });
	const cards = wrapper.findAll('[role="checkbox"]');
	await cards[1]!.trigger('click');
	expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['a', 'b']]);
	await wrapper.setProps({ modelValue: ['a', 'b'] });
	expect(cards[0]!.attributes('aria-checked')).toBe('true');
	expect(cards[1]!.attributes('aria-checked')).toBe('true');
	await cards[0]!.trigger('click');
	expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([['b']]);
	expect(modelValue).toEqual(['a']);
});

test('follows external changes and treats null as an empty selection', async () => {
	const wrapper = mount(VCheckboxCards, { props: { items, modelValue: null }, global });
	const cards = wrapper.findAll('[role="checkbox"]');
	await wrapper.setProps({ modelValue: ['b'] });
	expect(cards[1]!.attributes('aria-checked')).toBe('true');
	await wrapper.setProps({ modelValue: null });
	expect(cards.every((card) => card.attributes('aria-checked') === 'false')).toBe(true);
});

test('preserves numeric values and distinguishes them from strings', async () => {
	const wrapper = mount(VCheckboxCards, {
		props: {
			items: [
				{ value: 0, label: 'Number' },
				{ value: '0', label: 'String' },
			],
		},
		global,
	});

	const cards = wrapper.findAll('[role="checkbox"]');
	await cards[0]!.trigger('click');
	await wrapper.setProps({ modelValue: [0] });
	await cards[1]!.trigger('click');
	expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[0, '0']]);
});

test('supports disabled items and disabling the entire group', async () => {
	const wrapper = mount(VCheckboxCards, { props: { items: [{ ...items[0]!, disabled: true }, items[1]!] }, global });
	const cards = wrapper.findAll('[role="checkbox"]');
	await cards[0]!.trigger('click');
	expect(wrapper.emitted('update:modelValue')).toBeUndefined();
	await wrapper.setProps({ disabled: true });
	await cards[1]!.trigger('click');
	expect(cards.every((card) => card.attributes('disabled') !== undefined)).toBe(true);
	expect(wrapper.emitted('update:modelValue')).toBeUndefined();
});

test('renders shared content with accessible labels and descriptions', () => {
	const wrapper = mount(VCheckboxCards, { props: { items }, global });
	const card = wrapper.find('[role="checkbox"]');
	expect(card.find('.icon-box').exists()).toBe(true);
	expect(card.find(`[id="${card.attributes('aria-labelledby')}"]`).text()).toBe('Article');
	expect(card.find(`[id="${card.attributes('aria-describedby')}"]`).text()).toBe('A written story');
});

test('custom content receives selection state and label IDs', async () => {
	const wrapper = mount(VCheckboxCards, {
		props: { items },
		global,
		slots: {
			item: `<template #item="{ item, selected, labelId, descriptionId }"><span :id="labelId">{{ item.label }}</span><span :id="descriptionId">{{ item.description }}</span><span class="selected">{{ selected }}</span></template>`,
		},
	});

	const card = wrapper.find('[role="checkbox"]');
	expect(card.find('.icon-box').exists()).toBe(false);
	await card.trigger('click');
	await wrapper.setProps({ modelValue: ['a'] });
	expect(card.find('.selected').text()).toBe('true');
	expect(card.find(`[id="${card.attributes('aria-labelledby')}"]`).text()).toBe('Article');
});

test('keeps the current selection when the parent rejects an update', async () => {
	const wrapper = mount(VCheckboxCards, { props: { items, modelValue: ['a'] }, global });
	const cards = wrapper.findAll('[role="checkbox"]');
	await cards[1]!.trigger('click');
	expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['a', 'b']]);
	expect(cards[1]!.attributes('aria-checked')).toBe('false');
	await cards[0]!.trigger('click');
	expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[]]);
});

test('follows in-place changes to the parent selection array', async () => {
	const modelValue = reactive(['a']);
	const wrapper = mount(VCheckboxCards, { props: { items, modelValue }, global });
	const cards = wrapper.findAll('[role="checkbox"]');
	modelValue.push('b');
	await nextTick();
	expect(cards[1]!.attributes('aria-checked')).toBe('true');
	modelValue.splice(0, 1);
	await nextTick();
	expect(cards[0]!.attributes('aria-checked')).toBe('false');
	await cards[1]!.trigger('click');
	expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]]);
	expect(modelValue).toEqual(['b']);
});

test('keeps every enabled checkbox in the Tab order, including selected cards', async () => {
	const wrapper = mount(VCheckboxCards, { props: { items, modelValue: ['a'], disabled: true }, global });
	await wrapper.setProps({ disabled: false });

	for (const card of wrapper.findAll<HTMLButtonElement>('[role="checkbox"]')) {
		expect(card.element.tabIndex).toBe(0);
		expect(card.element.disabled).toBe(false);
	}
});

import VSelect from './v-select.vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

import VMenu from '@/components/v-menu/';
import VList, { VListItem, VListItemContent, VListItemTitle } from '@/components/v-list/';
import VCheckbox from '@/components/v-checkbox/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-menu', VMenu);
localVue.component('v-list', VList);
localVue.component('v-list-item', VListItem);
localVue.component('v-list-item-content', VListItemContent);
localVue.component('v-list-item-title', VListItemTitle);
localVue.component('v-checkbox', VCheckbox);

describe('Components / Select', () => {
	it('Renders', () => {
		const component = shallowMount(VSelect, {
			localVue,
			propsData: {
				items: [
					{ text: 'test', value: 1 },
					{ text: 'test', value: 2 },
				],
			},
		});
		expect(component.isVueInstance()).toBe(true);
	});

	it('Converts the items to a standardized array', async () => {
		const component = shallowMount(VSelect, {
			localVue,
			propsData: {
				items: ['Item 1', 'Item 2'],
			},
		});

		expect((component.vm as any)._items).toEqual([
			{
				text: 'Item 1',
				value: 'Item 1',
			},
			{
				text: 'Item 2',
				value: 'Item 2',
			},
		]);

		component.setProps({
			items: [
				{
					test: 'item 1',
					another: 'value',
				},
			],
			itemText: 'test',
			itemValue: 'another',
		});

		await component.vm.$nextTick();

		expect((component.vm as any)._items).toEqual([
			{
				text: 'item 1',
				value: 'value',
			},
		]);
	});

	it('Calculates the displayValue based on the given value', async () => {
		const component = shallowMount(VSelect, {
			localVue,
			propsData: {
				items: ['Item 1', 'Item 2'],
				value: 'Item 1',
			},
		});

		expect((component.vm as any).displayValue).toBe('Item 1');

		component.setProps({
			items: [
				{
					text: 'Item 1',
					value: 'item-1',
				},
			],
			value: 'item-1',
		});

		await component.vm.$nextTick();

		expect((component.vm as any).displayValue).toBe('Item 1');

		component.setProps({
			itemText: 'test',
			itemValue: 'test2',
			items: [
				{
					test: 'Item 1',
					test2: 'item-1',
				},
			],
			value: 'item-1',
		});

		await component.vm.$nextTick();

		expect((component.vm as any).displayValue).toBe('Item 1');

		component.setProps({
			itemText: 'text',
			itemValue: 'value',
			items: [
				{
					text: 'Item 1',
					value: 'item-1',
				},
				{
					text: 'Item 2',
					value: 'item-2',
				},
			],
			multiple: true,
			value: ['item-1', 'item-2'],
		});

		await component.vm.$nextTick();

		expect((component.vm as any).displayValue).toBe('Item 1, Item 2');
	});
});

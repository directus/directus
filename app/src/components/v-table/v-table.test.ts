import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue, Wrapper } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VCheckbox from '@/components/v-checkbox/';
import VIcon from '@/components/v-icon/';

localVue.component('v-checkbox', VCheckbox);
localVue.component('v-icon', VIcon);

import VTable from './v-table.vue';

describe('Table', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VTable, { localVue, propsData: { headers: [], items: [] } });
	});

	it('Renders the correct amount of rows for the given items', async () => {
		component.setProps({ items: [{}, {}, {}] });
		await component.vm.$nextTick();
		expect(component.findAll('.table-row').length).toBe(3);
	});

	it('Adds the defaults to the passed headers', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
			],
		});

		await component.vm.$nextTick();

		expect((component.vm as any)._headers).toEqual([
			{
				text: 'Column 1',
				value: 'col1',
				sortable: true,
				align: 'left',
				width: null,
			},
		]);
	});

	it('Sorts the items based on the passed props', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
			items: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
			sort: {
				by: 'col1',
				desc: false,
			},
		});

		await component.vm.$nextTick();

		expect((component.vm as any)._items).toEqual([
			{
				col1: 'A',
				col2: 3,
			},
			{
				col1: 'B',
				col2: 2,
			},
			{
				col1: 'C',
				col2: 1,
			},
		]);
	});

	it('Calculates if all items are selected', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
			items: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
			selection: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
		});

		await component.vm.$nextTick();

		expect((component.vm as any).allItemsSelected).toEqual(true);
		expect((component.vm as any).someItemsSelected).toEqual(false);
	});

	it('Calculates if some items are selected', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
			items: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
			selection: [
				{
					col1: 'A',
					col2: 3,
				},
			],
		});

		await component.vm.$nextTick();

		expect((component.vm as any).allItemsSelected).toEqual(false);
		expect((component.vm as any).someItemsSelected).toEqual(true);
	});

	it('Handles sort by updates coming from header', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
			items: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
		});

		await component.vm.$nextTick();

		component.find('th .content').trigger('click');

		expect((component.vm as any)._sort.by).toEqual('col1');
		expect(component.emitted('update:sort')?.[0]).toEqual([{ by: 'col1', desc: false }]);
	});

	it('Handles sort desc updates coming from header', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
			items: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
			sort: {
				by: 'col1',
				desc: false,
			},
		});

		await component.vm.$nextTick();

		component.find('th .content').trigger('click');

		expect(component.emitted('update:sort')?.[0]).toEqual([{ by: 'col1', desc: true }]);
	});

	it('Updates selection correctly', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
			items: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
			selection: [],
			showSelect: true,
		});

		await component.vm.$nextTick();

		component.find('.table-row .select > *').trigger('click');

		expect(component.emitted('select')?.[0]).toEqual([
			[
				{
					col1: 'A',
					col2: 3,
				},
			],
		]);

		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
			items: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
			selection: [
				{
					col1: 'A',
					col2: 3,
				},
			],
			showSelect: true,
			itemKey: 'col1',
		});

		await component.vm.$nextTick();

		component.find('.table-row .select > *').trigger('click');

		expect(component.emitted('select')?.[1]).toEqual([[]]);
	});

	it('Calculates selected state per row', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
			items: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
			selection: [
				{
					col1: 'A',
					col2: 3,
				},
			],
			showSelect: true,
			itemKey: 'col1',
		});

		await component.vm.$nextTick();

		expect(
			(component.vm as any).getSelectedState({
				col1: 'A',
				col2: 3,
			})
		).toEqual(true);

		expect(
			(component.vm as any).getSelectedState({
				col1: 'C',
				col2: 1,
			})
		).toEqual(false);
	});

	it('Selects all items if header checkbox is clicked', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
			items: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
			selection: [
				{
					col1: 'A',
					col2: 3,
				},
			],
			showSelect: true,
			itemKey: 'col1',
		});

		await component.vm.$nextTick();

		component.find('.table-header .select > *').trigger('click');

		expect(component.emitted('select')?.[0]).toEqual([
			[
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
		]);

		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
			items: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
			selection: [
				{
					col1: 'A',
					col2: 3,
				},
				{
					col1: 'C',
					col2: 1,
				},
				{
					col1: 'B',
					col2: 2,
				},
			],
			showSelect: true,
			itemKey: 'col1',
		});

		await component.vm.$nextTick();

		component.find('.table-header .select > *').trigger('click');

		expect(component.emitted('select')?.[1]).toEqual([[]]);
	});

	describe('Sorting', () => {
		it('Sorts the items by the given sort prop internally', async () => {
			component.setProps({
				items: [
					{
						col1: 'A',
					},
					{
						col1: 'C',
					},
					{
						col1: 'B',
					},
				],
				sort: {
					by: 'col1',
					desc: false,
				},
			});

			await component.vm.$nextTick();

			expect((component.vm as any)._items).toEqual([
				{
					col1: 'A',
				},
				{
					col1: 'B',
				},
				{
					col1: 'C',
				},
			]);
		});

		it('Sorts the items in descending order if sort.desc is set to true', async () => {
			component.setProps({
				items: [
					{
						col1: 'A',
					},
					{
						col1: 'C',
					},
					{
						col1: 'B',
					},
				],
				sort: {
					by: 'col1',
					desc: true,
				},
			});

			await component.vm.$nextTick();

			expect((component.vm as any)._items).toEqual([
				{
					col1: 'C',
				},
				{
					col1: 'B',
				},
				{
					col1: 'A',
				},
			]);
		});

		it('Does not sort the items if the server-sort prop is set', async () => {
			component.setProps({
				items: [
					{
						col1: 'A',
					},
					{
						col1: 'C',
					},
					{
						col1: 'B',
					},
				],
				sort: {
					by: 'col1',
					desc: false,
				},
				serverSort: true,
			});

			await component.vm.$nextTick();

			expect((component.vm as any)._items).toEqual([
				{
					col1: 'A',
				},
				{
					col1: 'C',
				},
				{
					col1: 'B',
				},
			]);
		});

		it('Does not sort if manual sorting is activated', async () => {
			component.setProps({
				items: [
					{
						col1: 'A',
					},
					{
						col1: 'C',
					},
					{
						col1: 'B',
					},
				],
				sort: {
					by: '$manual',
					desc: false,
				},
			});

			await component.vm.$nextTick();

			expect((component.vm as any)._items).toEqual([
				{
					col1: 'A',
				},
				{
					col1: 'C',
				},
				{
					col1: 'B',
				},
			]);
		});
	});

	it('Emits the update:items event when the internal items array is updated', async () => {
		component.setProps({
			items: [],
		});

		await component.vm.$nextTick();

		(component.vm as any)._items = [
			{
				col1: 'A',
			},
			{
				col1: 'C',
			},
			{
				col1: 'B',
			},
		];

		await component.vm.$nextTick();

		expect(component.emitted('update:items')?.[0]).toEqual([
			[
				{
					col1: 'A',
				},
				{
					col1: 'C',
				},
				{
					col1: 'B',
				},
			],
		]);
	});

	it('Emits updated headers without default values', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
				},
			],
		});

		await component.vm.$nextTick();

		(component.vm as any)._headers = [
			{
				text: 'Column 1',
				value: 'col1',
				width: null, // default, should be removed
			},
			{
				text: 'Column 2',
				value: 'col2',
				width: 150, // should be staged
			},
		];

		await component.vm.$nextTick();

		expect(component.emitted('update:headers')?.[0]).toEqual([
			[
				{
					text: 'Column 1',
					value: 'col1',
				},
				{
					text: 'Column 2',
					value: 'col2',
					width: 150,
				},
			],
		]);
	});
});

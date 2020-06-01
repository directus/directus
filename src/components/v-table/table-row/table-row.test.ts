import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue, Wrapper } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VCheckbox from '@/components/v-checkbox/';
import VIcon from '@/components/v-icon/';

localVue.component('v-checkbox', VCheckbox);
localVue.component('v-icon', VIcon);

import TableRow from './table-row.vue';

describe('Table / Row', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(TableRow, {
			localVue,
			propsData: {
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
				item: {
					col1: 'Test',
					col2: 'Test 2',
				},
			},
		});
	});

	it('Renders right amount of cells per row', async () => {
		expect(component.find('.table-row').findAll('td').length).toBe(3);
	});

	it('Renders the provided element in the nested scoped slot', async () => {
		const component = mount(TableRow, {
			localVue,
			propsData: {
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
				item: {
					col1: 'Test 1 Col 1',
					col2: 'Test 1 Col 2',
				},
			},
			scopedSlots: {
				'item.col2': '<template slot-scope="{item}"><p>{{ item.col2 }}</p></template>',
			},
		});

		expect(component.find('.table-row td:nth-child(2) > *').html()).toEqual('<p>Test 1 Col 2</p>');
	});

	it('Adds the align class', async () => {
		component.setProps({
			headers: [
				{
					text: 'Col1',
					value: 'col1',
					sortable: true,
					align: 'left',
				},
				{
					text: 'Col2',
					value: 'col2',
					sortable: true,
					align: 'center',
				},
				{
					text: 'Col3',
					value: 'col3',
					sortable: true,
					align: 'right',
				},
			],
		});

		await component.vm.$nextTick();

		expect(component.find('td:first-child').classes()).toContain('align-left');
		expect(component.find('td:nth-child(2)').classes()).toContain('align-center');
		expect(component.find('td:nth-child(3)').classes()).toContain('align-right');
	});

	it('Emits item selection changes on checkbox click', async () => {
		component.setProps({
			showSelect: true,
		});

		await component.vm.$nextTick();

		component.find(VCheckbox).trigger('click');

		expect(component.emitted('item-selected')?.[0]).toEqual([
			{
				item: {
					col1: 'Test',
					col2: 'Test 2',
				},
				value: true,
			},
		]);
	});
});

import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue, Wrapper } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VCheckbox from '@/components/v-checkbox';
import VIcon from '@/components/v-icon';

localVue.component('v-checkbox', VCheckbox);
localVue.component('v-icon', VIcon);

import TableHeader from './table-header.vue';

describe('Table / Header', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(TableHeader, {
			localVue,
			propsData: {
				headers: [
					{
						text: 'Column 1',
						value: 'col1',
					},
				],
				sort: {
					by: null,
					desc: false,
				},
			},
		});
	});

	it('Gets the right classes for the passed props', async () => {
		component.setProps({
			sort: {
				by: 'col1',
				desc: true,
			},
		});

		await component.vm.$nextTick();

		const classes = (component.vm as any).getClassesForHeader({
			text: 'Column 1',
			value: 'col1',
			align: 'center',
			sortable: true,
		});

		expect(classes).toEqual(['align-center', 'sortable', 'sort-desc']);
	});

	it('Emits the correct update event on sorting changes', async () => {
		component.setProps({
			sort: {
				by: null,
				desc: true,
			},
		});

		await component.vm.$nextTick();

		component.find('th .content').trigger('click');
		expect(component.emitted('update:sort')?.[0]).toEqual([{ by: 'col1', desc: false }]);

		component.setProps({
			sort: {
				by: 'col1',
				desc: false,
			},
		});

		await component.vm.$nextTick();

		component.find('th .content').trigger('click');

		expect(component.emitted('update:sort')?.[1]).toEqual([{ by: 'col1', desc: true }]);

		component.setProps({
			sort: {
				by: 'col1',
				desc: true,
			},
		});

		await component.vm.$nextTick();

		component.find('th .content').trigger('click');
		expect(component.emitted('update:sort')?.[2]).toEqual([{ by: null, desc: false }]);
	});

	it("Doesn't emit the update sort event when dragging", async () => {
		(component.vm as any).dragging = true;

		component.find('th .content').trigger('click');
		expect(component.emitted('update:sort')).toEqual(undefined);
	});

	it('Emits toggle-select-all on checkbox click', async () => {
		component.setProps({
			showSelect: true,
			sort: {
				by: null,
				desc: false,
			},
		});

		await component.vm.$nextTick();

		component.find(VCheckbox).trigger('click');

		expect(component.emitted('toggle-select-all')?.[0]).toEqual([true]);
	});

	it('Prevents unsortable columns from being sorted', async () => {
		component.setProps({
			headers: [
				{
					text: 'Column 1',
					value: 'col1',
					sortable: false,
				},
			],
		});

		await component.vm.$nextTick();

		component.find('th .content').trigger('click');

		expect(component.emitted()).toEqual({});
	});

	it('Renders correct thead for provided headers', async () => {
		component.setProps({
			headers: [
				{
					text: 'Col1',
					value: 'col1',
					align: 'left',
					sortable: true,
				},
				{
					text: 'Col2',
					value: 'col2',
					align: 'left',
					sortable: true,
				},
			],
		});

		await component.vm.$nextTick();

		expect(component.find('th:first-child').html()).toContain('Col1');
		expect(component.find('th:nth-child(2)').html()).toContain('Col2');
	});

	it('Adds the align class to the header', async () => {
		component.setProps({
			headers: [
				{
					text: 'Col1',
					value: 'col1',
					align: 'left',
				},
				{
					text: 'Col2',
					value: 'col2',
					align: 'center',
				},
				{
					text: 'Col3',
					value: 'col3',
					align: 'right',
				},
			],
		});

		await component.vm.$nextTick();

		expect(component.find('th:first-child').classes()).toContain('align-left');
		expect(component.find('th:nth-child(2)').classes()).toContain('align-center');
		expect(component.find('th:nth-child(3)').classes()).toContain('align-right');
	});

	it('Renders the provided element in the nested scoped slot for the header', async () => {
		const component = mount(TableHeader, {
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
				sort: {
					by: null,
					desc: false,
				},
			},
			scopedSlots: {
				'header.col2': '<template slot-scope="{header}"><p>{{ header.text }}</p></template>',
			},
		});

		expect(component.find('.table-header th:nth-child(2) .content > span > *').html()).toEqual('<p>Column 2</p>');
	});

	it('Sets the dragging state correctly based on mouse interaction', async () => {
		component.setProps({
			showResize: true,
			headers: [
				{
					text: 'Col1',
					value: 'col1',
					align: 'left',
					sortable: true,
				},
				{
					text: 'Col2',
					value: 'col2',
					align: 'left',
					sortable: true,
				},
			],
		});

		await component.vm.$nextTick();

		expect((component.vm as any).dragging).toBe(false);

		component.find('.resize-handle').trigger('mousedown');

		expect((component.vm as any).dragging).toBe(true);

		window.dispatchEvent(new Event('mouseup'));

		expect((component.vm as any).dragging).toBe(false);
	});

	it('Calculates the new header size correctly', async () => {
		component.setProps({
			showResize: true,
			headers: [
				{
					text: 'Col1',
					value: 'col1',
					align: 'left',
					sortable: true,
				},
				{
					text: 'Col2',
					value: 'col2',
					align: 'left',
					sortable: true,
				},
			],
		});

		await component.vm.$nextTick();

		// Set internal dragging state to dummy values after starting resize
		(component.vm as any).dragging = true;
		(component.vm as any).dragStartX = 0;
		(component.vm as any).dragStartWidth = 100;
		(component.vm as any).dragHeader = {
			text: 'Col1',
			value: 'col1',
			align: 'left',
			sortable: true,
		};

		await component.vm.$nextTick();

		(component.vm as any).onMouseMove({
			pageX: 50,
		});

		expect(component.emitted('update:headers')?.[0][0][0].width).toBe(150);
	});

	it("Doesn't trigger on mousemove if dragging is false", async () => {
		(component.vm as any).onMouseMove({
			pageX: 50,
		});

		expect(component.emitted('update:headers')).toBe(undefined);
	});
});

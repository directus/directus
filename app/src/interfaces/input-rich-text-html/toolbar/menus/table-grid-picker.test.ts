import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import TableGridPicker from './table-grid-picker.vue';

const global = {
	plugins: [createI18n({ legacy: false })],
};

interface Vm {
	select: (rows: number, cols: number) => void;
}

function mountPicker() {
	const wrapper = mount(TableGridPicker, { global });
	return { wrapper, vm: wrapper.vm as unknown as Vm };
}

describe('table-grid-picker', () => {
	test('renders a maxRows × maxCols grid of cells', () => {
		const wrapper = mount(TableGridPicker, { props: { maxRows: 4, maxCols: 5 }, global });
		expect(wrapper.findAll('.cell')).toHaveLength(20);
	});

	test('select emits the chosen dimensions', () => {
		const { wrapper, vm } = mountPicker();
		vm.select(3, 4);
		expect(wrapper.emitted('select')).toEqual([[{ rows: 3, cols: 4 }]]);
	});

	test('clicking a cell emits its dimensions', async () => {
		const wrapper = mount(TableGridPicker, { props: { maxRows: 3, maxCols: 3 }, global });
		// cells are laid out row-major, so the 6th cell (index 5) is row 2, col 3
		await wrapper.findAll('.cell')[5]!.trigger('click');
		expect(wrapper.emitted('select')).toEqual([[{ rows: 2, cols: 3 }]]);
	});

	test('hovering a cell highlights the rectangle up to it', async () => {
		const wrapper = mount(TableGridPicker, { props: { maxRows: 3, maxCols: 3 }, global });
		// hover row 2, col 2 → cells (1,1),(1,2),(2,1),(2,2) become active
		await wrapper.findAll('.cell')[4]!.trigger('mouseover');
		expect(wrapper.findAll('.cell.active')).toHaveLength(4);
	});
});

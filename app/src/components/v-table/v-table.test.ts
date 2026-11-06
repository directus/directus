import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import TableRow from './table-row.vue';
import type { Item } from './types';
import VTable from './v-table.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const headers = [{ text: 'Name', value: 'name' }];

const global: GlobalMountOptions = {
	stubs: ['table-header', 'v-icon', 'v-checkbox', 'v-text-overflow', 'value-null'],
};

function mountTable(props: { items: Item[]; modelValue: unknown[]; selectionUseKeys?: boolean }) {
	return mount(VTable, {
		props: { headers, showSelect: 'multiple' as const, ...props },
		global,
	});
}

function selectedStates(wrapper: ReturnType<typeof mountTable>) {
	return wrapper.findAllComponents(TableRow).map((row) => row.props('isSelected'));
}

const items: Item[] = [
	{ id: 1, name: 'A' },
	{ id: 2, name: 'B' },
	{ id: 3, name: 'C' },
];

describe('selection state', () => {
	test('matches selected items by item key', () => {
		const wrapper = mountTable({ items, modelValue: [{ id: 2, name: 'B' }] });

		expect(selectedStates(wrapper)).toEqual([false, true, false]);
	});

	test('matches selected keys when selectionUseKeys is set', () => {
		const wrapper = mountTable({ items, modelValue: [1, 3], selectionUseKeys: true });

		expect(selectedStates(wrapper)).toEqual([true, false, true]);
	});

	test('matches items without a key yet by $index', () => {
		const wrapper = mountTable({
			items: [{ id: 1 }, { $index: 0 }, { $index: 1 }],
			modelValue: [{ $index: 1 }],
		});

		expect(selectedStates(wrapper)).toEqual([false, false, true]);
	});

	test('updates when the selection changes', async () => {
		const wrapper = mountTable({ items, modelValue: [] });

		expect(selectedStates(wrapper)).toEqual([false, false, false]);

		await wrapper.setProps({ modelValue: items });

		expect(selectedStates(wrapper)).toEqual([true, true, true]);
	});

	test('toggles a row off based on its selected state', async () => {
		const wrapper = mountTable({ items, modelValue: [1, 2], selectionUseKeys: true });

		wrapper.findAllComponents(TableRow)[1]!.vm.$emit('item-selected');

		expect(wrapper.emitted('update:modelValue')).toEqual([[[1]]]);
	});
});

import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { Comment, h } from 'vue';
import type { HeaderRaw } from './types';
import VTable from './v-table.vue';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';

const headers: HeaderRaw[] = [
	{ text: 'Name', value: 'name', width: 200 },
	{ text: 'Email', value: 'email', width: 250 },
];

const items = [
	{ id: 1, name: 'Ada', email: 'ada@example.com' },
	{ id: 2, name: 'Grace', email: 'grace@example.com' },
];

const global: GlobalMountOptions = {
	stubs: ['table-header', 'v-progress-linear', 'v-icon', 'v-checkbox', 'value-null'],
	directives: { tooltip: Tooltip },
};

function mountTable() {
	const renderCell = vi.fn((field: string, item: Record<string, any>) => h('span', { class: 'custom' }, item[field]));

	const wrapper = mount(VTable, {
		props: { headers, items },
		slots: {
			'item.name': ({ item }: { item: Record<string, any> }) => renderCell('name', item),
			'item-append': ({ item }: { item: Record<string, any> }) => h('button', { class: 'append-button' }, item.id),
		},
		global,
	});

	return { wrapper, renderCell };
}

describe('VTable', () => {
	test('renders item slots, falls back to the raw value, and renders item-append', () => {
		const { wrapper } = mountTable();

		const rows = wrapper.findAll('tbody tr');
		expect(rows).toHaveLength(2);

		expect(rows[0]!.find('.custom').text()).toBe('Ada');
		expect(rows[0]!.findComponent({ name: 'VTextOverflow' }).props('text')).toBe('ada@example.com');
		expect(rows[1]!.find('td.append .append-button').text()).toBe('2');
	});

	test('falls back to the raw value when an item slot renders nothing', () => {
		const wrapper = mount(VTable, {
			props: { headers, items },
			slots: { 'item.email': () => [h(Comment)] },
			global,
		});

		const emailCell = wrapper.findAll('tbody tr')[0]!.findAll('td')[1]!;
		expect(emailCell.findComponent({ name: 'VTextOverflow' }).props('text')).toBe('ada@example.com');
	});

	test('does not re-render rows when the table re-renders for unrelated changes', async () => {
		const { wrapper, renderCell } = mountTable();
		renderCell.mockClear();

		await wrapper.setProps({ noItemsText: 'Nothing here' });

		expect(renderCell).not.toHaveBeenCalled();
	});

	test('does not re-render rows when only column widths change', async () => {
		const { wrapper, renderCell } = mountTable();
		renderCell.mockClear();

		await wrapper.setProps({ headers: [{ ...headers[0]!, width: 300 }, headers[1]!] });

		expect(renderCell).not.toHaveBeenCalled();
	});

	test('re-renders rows when a header changes in a way rows use', async () => {
		const { wrapper, renderCell } = mountTable();
		renderCell.mockClear();

		await wrapper.setProps({ headers: [{ ...headers[0]!, align: 'right' }, headers[1]!] });

		expect(renderCell).toHaveBeenCalledTimes(2);
		expect(wrapper.find('tbody td.align-right').exists()).toBe(true);
	});

	test('re-renders only the row whose item changed', async () => {
		const { wrapper, renderCell } = mountTable();
		renderCell.mockClear();

		await wrapper.setProps({ items: [items[0]!, { ...items[1]!, name: 'Hopper' }] });

		expect(renderCell).toHaveBeenCalledTimes(1);
		expect(wrapper.findAll('tbody tr')[1]!.find('.custom').text()).toBe('Hopper');
	});
});

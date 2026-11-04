import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { h } from 'vue';
import TableRow from './table-row.vue';
import type { Header } from './types';
import type { GlobalMountOptions } from '@/__utils__/types';

const headers = [
	{
		text: 'Name',
		value: 'name',
		description: null,
		align: 'left' as const,
		sortable: true,
		width: 200,
	},
] as Header[];

const global: GlobalMountOptions = {
	stubs: ['v-icon', 'v-checkbox', 'v-text-overflow', 'value-null'],
};

function mountTableRow(attachTo: Element = document.body) {
	return mount(TableRow, {
		props: {
			headers,
			item: { id: 1, name: 'Flow A' },
			showSelect: 'multiple' as const,
			showManualSort: true,
			hasClickListener: true,
			slotNames: 'item-append',
			itemSlots: {
				'item-append': () => [h('button', { class: 'ctx-toggle' }, 'More')],
			},
		},
		attachTo,
		global,
	});
}

afterEach(() => {
	document.body.innerHTML = '';
});

describe('TableRow', () => {
	test('emits click when a content cell is clicked', async () => {
		const wrapper = mountTableRow();

		await wrapper.find('td.cell:not([data-row-action])').trigger('click');

		expect(wrapper.emitted('click')).toHaveLength(1);
	});

	test('does not emit click when one of the row controls is clicked', async () => {
		const wrapper = mountTableRow();

		for (const selector of ['td.manual', 'td.select', 'td.append', '.ctx-toggle']) {
			await wrapper.find(selector).trigger('click');
		}

		expect(wrapper.emitted('click')).toBeUndefined();
	});

	test('emits click when an ancestor above the row carries the row action attribute', async () => {
		const container = document.createElement('div');
		container.setAttribute('data-row-action', '');
		document.body.append(container);

		const wrapper = mountTableRow(container);

		await wrapper.find('td.cell:not([data-row-action])').trigger('click');

		expect(wrapper.emitted('click')).toHaveLength(1);
	});

	test('lets clicks on the row controls reach the document so open menus can close', async () => {
		const onDocumentClick = vi.fn();
		document.documentElement.addEventListener('click', onDocumentClick);

		const wrapper = mountTableRow();

		try {
			await wrapper.find('.ctx-toggle').trigger('click');

			expect(onDocumentClick).toHaveBeenCalledTimes(1);
		} finally {
			document.documentElement.removeEventListener('click', onDocumentClick);
		}
	});

	test('renders 0 and false, and a placeholder for missing values', () => {
		const wrapper = mount(TableRow, {
			props: {
				headers: [
					{ ...headers[0]!, value: 'count' },
					{ ...headers[0]!, value: 'active' },
					{ ...headers[0]!, value: 'author.name' },
				],
				item: { id: 1, count: 0, active: false, author: null },
			},
			global,
		});

		const cells = wrapper.findAll('td.cell:not(.spacer)');

		expect(cells[0]!.find('v-text-overflow-stub').attributes('text')).toBe('0');
		expect(cells[1]!.find('v-text-overflow-stub').attributes('text')).toBe('false');
		expect(cells[2]!.find('.null').text()).toBe('--');
	});

	test('does not read header widths, so rows can keep headers across column resizes', () => {
		const reads = new Set<PropertyKey>();

		const header = new Proxy(headers[0]!, {
			get(target, key, receiver) {
				reads.add(key);
				return Reflect.get(target, key, receiver);
			},
		});

		// Mount through a wrapper: test-utils walks every key of props passed to mount, which would read width
		mount(() => h(TableRow, { headers: [header], item: { id: 1, name: 'Flow A' } }), { global });

		expect(reads).toContain('value');
		expect(reads).not.toContain('width');
	});
});

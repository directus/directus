import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
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

function mountTableRow() {
	return mount(TableRow, {
		props: {
			headers,
			item: { id: 1, name: 'Flow A' },
			showSelect: 'multiple' as const,
			showManualSort: true,
			hasClickListener: true,
		},
		slots: {
			'item-append': '<button class="ctx-toggle">More</button>',
		},
		attachTo: document.body,
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
});

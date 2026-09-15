import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import TableRow from './table-row.vue';
import type { Header, Item } from './types';

const defaultProps = {
	headers: [
		{
			text: 'Name',
			value: 'name',
			align: 'left' as const,
		},
	] as Header[],
	item: {
		name: 'Flow 1',
	} as Item,
	hasClickListener: true,
};

describe('TableRow', () => {
	test('Mounts component successfully', () => {
		const wrapper = mount(TableRow, {
			props: defaultProps,
		});

		expect(wrapper.find('tr.table-row').exists()).toBe(true);
	});

	test('Emits click event when clicking a standard cell', async () => {
		const wrapper = mount(TableRow, {
			props: defaultProps,
		});

		const cell = wrapper.find('td.cell');
		await cell.trigger('click');

		expect(wrapper.emitted('click')).toHaveLength(1);
	});

	test('Does NOT emit row click event when clicking inside append cell (#28185)', async () => {
		const wrapper = mount(TableRow, {
			props: defaultProps,
			slots: {
				'item-append': '<button class="ctx-btn">Action</button>',
			},
		});

		const button = wrapper.find('.ctx-btn');
		expect(button.exists()).toBe(true);

		await button.trigger('click');

		// The row must NOT trigger row click navigation
		expect(wrapper.emitted('click')).toBeUndefined();
	});

	test('Allows click event in append cell to bubble without stopPropagation (#28185)', async () => {
		let clickBubbled = false;

		const wrapper = mount(TableRow, {
			props: defaultProps,
			slots: {
				'item-append': '<button class="ctx-btn">Action</button>',
			},
			attachTo: document.body,
		});

		const onDocumentClick = () => {
			clickBubbled = true;
		};

		document.documentElement.addEventListener('click', onDocumentClick);

		const button = wrapper.find('.ctx-btn');
		button.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

		document.documentElement.removeEventListener('click', onDocumentClick);
		wrapper.unmount();

		// Click MUST bubble to document.documentElement so v-click-outside can close previously open menus
		expect(clickBubbled).toBe(true);
	});
});

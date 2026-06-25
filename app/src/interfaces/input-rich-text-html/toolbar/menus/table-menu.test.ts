import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import { editorExtensions } from '../../extensions';
import TableMenu from './table-menu.vue';

const global = {
	plugins: [createI18n({ legacy: false })],
	directives: { tooltip: {} },
	stubs: {
		VMenu: true,
		VButton: true,
		VIcon: true,
		VList: true,
		VListItem: true,
		VListItemContent: true,
		VListItemIcon: true,
		VDivider: true,
	},
};

type Chain = ReturnType<Editor['chain']>;
interface Vm {
	insertTable: () => void;
	run: (command: (chain: Chain) => Chain) => void;
}

let editor: Editor;

beforeEach(() => {
	editor = new Editor({ extensions: editorExtensions, content: '<p>hello</p>' });
});

afterEach(() => editor.destroy());

function mountMenu() {
	const wrapper = mount(TableMenu, { props: { editor }, global });
	return wrapper.vm as unknown as Vm;
}

describe('table-menu', () => {
	test('insertTable adds a 3×3 table with a header row', () => {
		const vm = mountMenu();
		vm.insertTable();

		expect(editor.isActive('table')).toBe(true);

		const html = editor.getHTML();
		expect(html).toContain('<table');
		expect(html).toContain('<th');
		expect((html.match(/<tr/g) ?? []).length).toBe(3); // 1 header + 2 body
	});

	test('addRowAfter / addColumnAfter grow the table', () => {
		const vm = mountMenu();
		vm.insertTable();

		const rowsBefore = (editor.getHTML().match(/<tr/g) ?? []).length;
		vm.run((c) => c.addRowAfter());
		expect((editor.getHTML().match(/<tr/g) ?? []).length).toBe(rowsBefore + 1);

		const firstRow = editor.getHTML().match(/<tr[^>]*>.*?<\/tr>/s)?.[0] ?? '';
		const colsBefore = (firstRow.match(/<t[hd]/g) ?? []).length;
		vm.run((c) => c.addColumnAfter());
		const firstRowAfter = editor.getHTML().match(/<tr[^>]*>.*?<\/tr>/s)?.[0] ?? '';
		expect((firstRowAfter.match(/<t[hd]/g) ?? []).length).toBe(colsBefore + 1);
	});

	test('toggleHeaderRow removes the header cells', () => {
		const vm = mountMenu();
		vm.insertTable();
		expect(editor.getHTML()).toContain('<th');

		vm.run((c) => c.toggleHeaderRow());
		expect(editor.getHTML()).not.toContain('<th');
	});

	test('deleteTable removes the table', () => {
		const vm = mountMenu();
		vm.insertTable();
		expect(editor.isActive('table')).toBe(true);

		vm.run((c) => c.deleteTable());
		expect(editor.isActive('table')).toBe(false);
		expect(editor.getHTML()).not.toContain('<table');
	});
});

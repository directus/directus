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
		TableGridPicker: true,
		// Render only the default slot so the slotted picker still mounts.
		SubmenuListItem: { template: '<div><slot /></div>' },
	},
};

type Chain = ReturnType<Editor['chain']>;
interface Vm {
	insertTable: (rows?: number, cols?: number) => void;
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
	test('insertTable adds a 3×3 table without a header row', () => {
		const vm = mountMenu();
		vm.insertTable();

		expect(editor.isActive('table')).toBe(true);

		const html = editor.getHTML();
		expect(html).toContain('<table');
		expect(html).not.toContain('<th');
		expect((html.match(/<tr/g) ?? []).length).toBe(3);
	});

	test('clicking a grid cell inserts a table of that size', async () => {
		// Rendering the full menu evaluates the edit items' `editor.can()` bindings, which need a
		// mounted ProseMirror view (absent in jsdom). Neutralize `can()` so those bindings don't throw.
		const mountedEditor = editor;
		mountedEditor.can = () => ({ mergeCells: () => false, splitCell: () => false }) as never;

		// Render the real picker (and slot-rendering menu stubs) to exercise the @select wiring.
		const wrapper = mount(TableMenu, {
			props: { editor: mountedEditor },
			global: {
				...global,
				stubs: {
					...global.stubs,
					VMenu: { template: '<div><slot /></div>' },
					VList: { template: '<div><slot /></div>' },
					TableGridPicker: false,
				},
			},
		});

		// The menu is open while the picker is visible.
		(wrapper.vm as unknown as { menuOpen: boolean }).menuOpen = true;

		// 6th cell (index 5) in the default 10-col grid is row 1, col 6
		await wrapper.findAll('.cell')[5]!.trigger('click');

		const html = mountedEditor.getHTML();
		expect((html.match(/<tr/g) ?? []).length).toBe(1);
		const firstRow = html.match(/<tr[^>]*>.*?<\/tr>/s)?.[0] ?? '';
		expect((firstRow.match(/<t[hd]/g) ?? []).length).toBe(6);

		// Picking a size closes the menu (the picker lives in a teleported flyout).
		expect((wrapper.vm as unknown as { menuOpen: boolean }).menuOpen).toBe(false);
	});

	test('insertTable honors picker dimensions', () => {
		const vm = mountMenu();
		vm.insertTable(2, 4); // 2 rows × 4 cols

		expect(editor.isActive('table')).toBe(true);

		const html = editor.getHTML();
		expect((html.match(/<tr/g) ?? []).length).toBe(2);
		const firstRow = html.match(/<tr[^>]*>.*?<\/tr>/s)?.[0] ?? '';
		expect((firstRow.match(/<t[hd]/g) ?? []).length).toBe(4);
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

	test('toggleHeaderRow adds and removes the header cells', () => {
		const vm = mountMenu();
		vm.insertTable();
		expect(editor.getHTML()).not.toContain('<th');

		vm.run((c) => c.toggleHeaderRow());
		expect(editor.getHTML()).toContain('<th');

		vm.run((c) => c.toggleHeaderRow());
		expect(editor.getHTML()).not.toContain('<th');
	});

	test('mergeCells / splitCell collapse and restore a 2-cell selection', () => {
		const vm = mountMenu();
		vm.insertTable();

		// positions of the first two cells (the leading header-row cells)
		const cellPositions: number[] = [];

		editor.state.doc.descendants((node, pos) => {
			if (node.type.name === 'tableHeader' || node.type.name === 'tableCell') cellPositions.push(pos);
		});

		vm.run((c) => c.setCellSelection({ anchorCell: cellPositions[0]!, headCell: cellPositions[1]! }));
		const cellsBefore = (editor.getHTML().match(/<t[hd]/g) ?? []).length;

		vm.run((c) => c.mergeCells());
		const merged = editor.getHTML();
		expect((merged.match(/<t[hd]/g) ?? []).length).toBe(cellsBefore - 1);
		expect(merged).toContain('colspan="2"');

		vm.run((c) => c.splitCell());
		expect((editor.getHTML().match(/<t[hd]/g) ?? []).length).toBe(cellsBefore);
	});

	test('toggleHeaderColumn converts the first column to header cells', () => {
		const vm = mountMenu();
		vm.insertTable();

		const headersBefore = (editor.getHTML().match(/<th/g) ?? []).length;
		vm.run((c) => c.toggleHeaderColumn());
		expect((editor.getHTML().match(/<th/g) ?? []).length).toBeGreaterThan(headersBefore);
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

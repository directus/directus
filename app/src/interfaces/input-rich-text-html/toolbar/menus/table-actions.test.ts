import { TextSelection } from '@tiptap/pm/state';
import { CellSelection } from '@tiptap/pm/tables';
import { Editor } from '@tiptap/vue-3';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { editorExtensions } from '../../extensions';
import { runContextCommand } from './table-actions';

let editor: Editor;

beforeEach(() => {
	editor = new Editor({ extensions: editorExtensions, content: '<p>x</p>' });
	editor.chain().focus().insertTable({ rows: 3, cols: 5, withHeaderRow: false }).run();
});

afterEach(() => editor.destroy());

/** Positions of every cell node, in row-major order. */
function cellPositions(): number[] {
	const positions: number[] = [];

	editor.state.doc.descendants((node, pos) => {
		if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') positions.push(pos);
	});

	return positions;
}

function colCount(): number {
	const firstRow = editor.getHTML().match(/<tr[^>]*>.*?<\/tr>/s)?.[0] ?? '';
	return (firstRow.match(/<t[hd]/g) ?? []).length;
}

function rowCount(): number {
	return (editor.getHTML().match(/<tr/g) ?? []).length;
}

function selectCells(fromIndex: number, toIndex: number): void {
	const cells = cellPositions();

	editor.view.dispatch(
		editor.state.tr.setSelection(CellSelection.create(editor.state.doc, cells[fromIndex]!, cells[toIndex]!)),
	);
}

function cursorInCell(index: number): void {
	const cells = cellPositions();
	editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, cells[index]! + 1)));
}

describe('runContextCommand', () => {
	test('deletes one column from a plain cursor selection', () => {
		cursorInCell(2);
		runContextCommand(editor, (c) => c.deleteColumn());
		expect(colCount()).toBe(4);
		expect(editor.getHTML()).toContain('<table');
	});

	test('deletes only the active column when several cells are selected (was: deletes the whole table)', () => {
		// Drag-select the first four columns of the top row, then delete column.
		selectCells(0, 3);
		runContextCommand(editor, (c) => c.deleteColumn());
		expect(colCount()).toBe(4); // exactly one removed, not four
		expect(editor.getHTML()).toContain('<table');
	});

	test('still deletes a column when the whole table is cell-selected (was: no-op)', () => {
		const cells = cellPositions();
		selectCells(0, cells.length - 1); // every cell
		runContextCommand(editor, (c) => c.deleteColumn());
		expect(colCount()).toBe(4);
	});

	test('deletes only the active row when several cells are selected', () => {
		selectCells(0, cellPositions().length - 1);
		runContextCommand(editor, (c) => c.deleteRow());
		expect(rowCount()).toBe(2); // one of three removed
	});
});

import { CellSelection } from '@tiptap/pm/tables';
import type { Editor } from '@tiptap/vue-3';

type Chain = ReturnType<Editor['chain']>;

/** Run a table command on the editor, focusing first — shared by the table toolbar menu and the bubble menu. */
export function run(editor: Editor | undefined, command: (chain: Chain) => Chain): void {
	if (editor) command(editor.chain().focus()).run();
}

/**
 * Run a single-target table command from the context popup.
 *
 */
export function runContextCommand(editor: Editor | undefined, command: (chain: Chain) => Chain): void {
	if (!editor) return;
	const chain = editor.chain().focus();
	const { selection } = editor.state;
	if (selection instanceof CellSelection) chain.setTextSelection(selection.$headCell.pos + 1);
	command(chain).run();
}

export interface TableAction {
	icon: string;
	/** i18n key under `wysiwyg_options` */
	label: string;
	command: (chain: Chain) => Chain;
	isEnabled: (editor: Editor) => boolean;
}

/**
 * Actions shown in the table context popup.
 */
export const tableActionGroups: TableAction[][] = [
	[
		{
			icon: 'grid_off',
			label: 'table_delete',
			command: (c) => c.deleteTable(),
			isEnabled: (e) => e.can().deleteTable(),
		},
	],
	[
		{
			icon: 'add_row_above',
			label: 'table_add_row_before',
			command: (c) => c.addRowBefore(),
			isEnabled: (e) => e.can().addRowBefore(),
		},
		{
			icon: 'add_row_below',
			label: 'table_add_row_after',
			command: (c) => c.addRowAfter(),
			isEnabled: (e) => e.can().addRowAfter(),
		},
		{
			icon: 'delete',
			label: 'table_delete_row',
			command: (c) => c.deleteRow(),
			isEnabled: (e) => e.can().deleteRow(),
		},
	],
	[
		{
			icon: 'add_column_left',
			label: 'table_add_column_before',
			command: (c) => c.addColumnBefore(),
			isEnabled: (e) => e.can().addColumnBefore(),
		},
		{
			icon: 'add_column_right',
			label: 'table_add_column_after',
			command: (c) => c.addColumnAfter(),
			isEnabled: (e) => e.can().addColumnAfter(),
		},
		{
			icon: 'delete',
			label: 'table_delete_column',
			command: (c) => c.deleteColumn(),
			isEnabled: (e) => e.can().deleteColumn(),
		},
	],
];

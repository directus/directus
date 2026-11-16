import type { Attributes } from '@tiptap/core';
import { TableCell, TableHeader, TableKit } from '@tiptap/extension-table';

// `resizable: true` also makes the node parse/serialize `colwidth`, so legacy column widths survive round-trip
const TABLE_OPTIONS = { resizable: true };

export const Table = TableKit.configure({ table: TABLE_OPTIONS });

function styleAlign(element: HTMLElement): 'left' | 'right' | 'center' | null {
	const align = element.style.textAlign.trim().toLowerCase();
	return align === 'left' || align === 'right' || align === 'center' ? align : null;
}

// TableKit falls back to the `align` attribute and writes it back as `text-align`, which drops the attribute
function withStyleOnlyAlign(cell: typeof TableCell) {
	return cell.extend({
		addAttributes() {
			const parent: Attributes = this.parent?.() ?? {};
			return { ...parent, align: { ...parent['align'], parseHTML: styleAlign } };
		},
	});
}

/** `Table` with cells that leave the `align` attribute to legacy-attributes.ts. Replaces `Table` by name. */
export const StyleAlignTable = [
	TableKit.configure({ table: TABLE_OPTIONS, tableCell: false, tableHeader: false }),
	withStyleOnlyAlign(TableCell),
	withStyleOnlyAlign(TableHeader),
];

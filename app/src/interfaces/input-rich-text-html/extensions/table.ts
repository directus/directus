import { TableKit } from '@tiptap/extension-table';

// `resizable: true` adds drag-to-resize handles and makes the node parse/serialize `colwidth`,
// so legacy column widths survive round-trip (CMS-2639).
export const Table = TableKit.configure({
	table: { resizable: true },
});

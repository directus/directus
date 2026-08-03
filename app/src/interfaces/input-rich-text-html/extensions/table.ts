import { TableKit } from '@tiptap/extension-table';

// `resizable: true` also makes the node parse/serialize `colwidth`, so legacy column widths survive round-trip
export const Table = TableKit.configure({
	table: { resizable: true },
});

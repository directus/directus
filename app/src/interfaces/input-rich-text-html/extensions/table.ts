import { TableKit } from '@tiptap/extension-table';

// `resizable: true` also makes the node parse/serialize `colwidth`, so legacy column widths survive round-trip
export const TABLE_OPTIONS = { resizable: true };

export const Table = TableKit.configure({ table: TABLE_OPTIONS });

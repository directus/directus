import type { Attribute } from '@directus/data';

export interface SqlStatementSelectJson {
	type: 'json';
	tableIndex: number;
	columnIndex: number;
	path: Attribute;
}

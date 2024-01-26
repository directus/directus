import type { AtLeastOneElement } from '@directus/data';

export interface AbstractSqlQuerySelectJsonNode {
	type: 'json';
	tableIndex: number;
	columnName: string;
	columnIndex: number;
	path: AtLeastOneElement<string>;
}

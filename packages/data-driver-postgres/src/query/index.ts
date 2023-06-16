import type { SqlStatement } from '@directus/data-sql';
import { from } from './from.js';
import { select } from './select.js';

export function constructSql(query: SqlStatement): string {
	return [select(query), from(query)].join(' ') + ';';
}

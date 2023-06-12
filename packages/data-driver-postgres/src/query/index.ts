import type { SqlStatement } from '@directus/data-sql';
import { from } from './from.js';
import { select } from './select.js';
import type { ParameterizedSQLStatement } from '@directus/data';
import { limit } from './limit.js';
import { replaceMarkers } from '../utils/index.js';

export function constructSql(query: SqlStatement): ParameterizedSQLStatement {
	const base = [select(query), from(query)].join(' ');

	const limitModifier = limit(query);

	return {
		statement: `${replaceMarkers(`${base} ${limitModifier.statement}`)};`,
		values: [...limitModifier.values],
	};
}

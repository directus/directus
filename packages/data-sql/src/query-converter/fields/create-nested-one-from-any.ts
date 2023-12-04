import type { AbstractQueryFieldNodeNestedUnionOne } from '@directus/data';
import type { AbstractSqlNestedOneFromAny } from '../../types/abstract-sql.js';

export function getNestedOneFromAny(field: AbstractQueryFieldNodeNestedUnionOne): AbstractSqlNestedOneFromAny {
	// create sub query (function)
	// use create-nested-many.ts functionss
}

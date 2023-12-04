import type { AbstractQueryFieldNodeNestedSingleOne } from '@directus/data';
import type { AbstractSqlNestedOneFromAny } from '../../types/abstract-sql.js';

export function getNestedOneFromAny(field: AbstractQueryFieldNodeNestedSingleOne): AbstractSqlNestedOneFromAny {
	// create sub query (function)
	// use create-nested-many.ts functionss
}

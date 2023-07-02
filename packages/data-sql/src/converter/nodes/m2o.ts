import type { AbstractQueryFieldNodeRelatedManyToOne } from '@directus/data';
import type { SqlStatementSelectColumn } from '../../types.js';

export const convertM2o = (abstractM2o: AbstractQueryFieldNodeRelatedManyToOne, aliasMap: Map<string, string>): SqlStatementSelectColumn => {
	/**
	 * This should work recursive with the `select` from `index.ts`, as each m2o can also have it's own o2m etc. Top level should be a flatMap of all columns.
	 * Relational fields should be aliasing both the collection and field names, to avoid duplicate field name errors.
	 */
};

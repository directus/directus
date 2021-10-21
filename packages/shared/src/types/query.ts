import { Filter } from './filter';

export type Query = {
	fields?: string[] | null;
	sort?: string[] | null;
	filter?: Filter | null;
	limit?: number | null;
	offset?: number | null;
	page?: number | null;
	search?: string | null;
	export?: 'json' | 'csv' | 'xml' | null;
	group?: string[] | null;
	aggregate?: Aggregate | null;
	deep?: Record<string, Query> | null;
	alias?: Record<string, string> | null;

	/**
	 * This isn't a publicly available query, but rather an internal flag used to union query nested
	 * o2m items.
	 *
	 * @todo Deprecate this in favor of an optimized run-ast flow
	 * @private
	 */
	union?: [string, unknown[]];
};

/**
 * Aggregate operation. Contains column name, and the field alias it should be returned as
 */
export type Aggregate = {
	avg?: string[];
	avgDistinct?: string[];
	count?: string[];
	countDistinct?: string[];
	sum?: string[];
	sumDistinct?: string[];
	min?: string[];
	max?: string[];
};

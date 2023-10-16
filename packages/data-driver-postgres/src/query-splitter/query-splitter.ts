import type { AbstractQuery } from '@directus/data';

export interface SplitUpQuery {
	rootQuery: AbstractQuery;
	o2mQueries: SplitUpQuery[];
}

/**
 * Filters the root abstract query by o2m nodes.
 * The o2m queries will get executed separately from the root query.
 *
 * @param query
 */
//@ts-ignore
export function extractO2MNodes(query: AbstractQuery): SplitUpQuery {
	/* @ TODO implement */
}

import type { Query } from '@directus/types';

/**
 * Internal version of query parameters,
 * where it is additionally allowed to specify the order of nulls.
 *
 * @see Query
 */
export type InternalQuery = Omit<Query, 'sort'> & {
	sort?: (string | { field: string; nulls?: 'first' | 'last' })[] | null;
};

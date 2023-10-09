import type { AbstractQueryFilterNode } from './modifiers/filters.js';
import type { AbstractQueryNodeLimit } from './modifiers/limit.js';
import type { AbstractQueryNodeOffset } from './modifiers/offset.js';
import type { AbstractQueryNodeSort } from './modifiers/sort.js';

/**
 * Optional attributes to customize the query results
 */
export interface AbstractQueryModifiers {
	limit?: AbstractQueryNodeLimit;
	offset?: AbstractQueryNodeOffset;
	sort?: AbstractQueryNodeSort[];
	filter?: AbstractQueryFilterNode;
}

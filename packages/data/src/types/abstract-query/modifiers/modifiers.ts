import type { AbstractQueryFilterNode } from './filters/filter.js';
import type { AbstractQueryNodeLimit } from './limit.js';
import type { AbstractQueryNodeOffset } from './offset.js';
import type { AbstractQueryNodeSort } from './sort.js';

/**
 * Optional attributes to customize the query results
 */
export interface AbstractQueryModifiers {
	limit?: AbstractQueryNodeLimit;
	offset?: AbstractQueryNodeOffset;
	sort?: AbstractQueryNodeSort[];
	filter?: AbstractQueryFilterNode;
}

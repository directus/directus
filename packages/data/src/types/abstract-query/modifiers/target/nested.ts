import type { AbstractQueryFieldNodeNestedSingleRelational } from '../../common/nested/relational.js';
import type { AbstractQueryFieldNodeNestedSingleObject } from '../../index.js';
import type { AbstractQueryTarget } from '../target.js';

/**
 * Node to query data from a m2o relation.
 */
export interface AbstractQueryTargetNestedOne {
	type: 'nested-one-target';

	/* From the related collection the user can pick primitives, apply a function or add another nested node */
	field: AbstractQueryTarget;

	/* A nested one target can be a relationship or a nested object  */
	nesting: AbstractQueryFieldNodeNestedSingleRelational | AbstractQueryFieldNodeNestedSingleObject;
}

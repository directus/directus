import type {
	AbstractQueryFieldNodeNestedRelationalAny,
	AbstractQueryFieldNodeNestedRelationalMany,
} from '../../common/nested/relational.js';
import type { AbstractQueryTarget } from '../target.js';

/**
 * Node to query data from a m2o or a2o relation.
 */
export interface AbstractQueryTargetNestedOne {
	type: 'nested-one-target';

	/* From the related collection the user can pick primitives, apply a function or add another nested node */
	field: AbstractQueryTarget;

	/* A nested one can either be from a m2o or an a2o relationship */
	meta: AbstractQueryFieldNodeNestedRelationalMany | AbstractQueryFieldNodeNestedRelationalAny; // AbstractQueryFieldNodeNestedObjectOne | AbstractQueryFieldNodeNestedJsonOne
}

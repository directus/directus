import type { AbstractQueryFieldNodeNestedRelationalOne } from '../../common/nested/relational.js';
import type { AbstractQueryTarget } from '../target.js';

export interface AbstractQueryTargetNestedOne {
	type: 'nested-one-target';

	/* From the related collection the user can pick primitives, apply a function or add another nested node */
	field: AbstractQueryTarget;

	meta: AbstractQueryFieldNodeNestedRelationalOne; // AbstractQueryFieldNodeNestedObjectOne | AbstractQueryFieldNodeNestedJsonOne
}

import type {
	AbstractQueryFieldNodeNestedRelationalAny,
	AbstractQueryFieldNodeNestedRelationalMany,
} from '../common/nested/relational.js';
import type { AbstractQueryFieldNode } from '../fields.js';
import type { AbstractQueryModifiers } from '../modifiers.js';

export interface AbstractQueryFieldNodeNestedSingleOne {
	type: 'nested-single-one';

	/* From the related collection the user can pick primitives, apply a function or add another nested node   */
	fields: AbstractQueryFieldNode[];

	alias: string;

	nesting: AbstractQueryFieldNodeNestedRelationalMany;
}

export interface AbstractQueryFieldNodeNestedUnionOne {
	type: 'nested-union-one';

	alias: string;

	nesting: AbstractQueryFieldNodeNestedRelationalAny;
}

export interface AbstractQueryFieldNodeNestedSingleMany {
	type: 'nested-single-many';

	/* From the related collection the user can pick primitives, apply a function or add another nested node */
	fields: AbstractQueryFieldNode[];

	alias: string;

	/** For many, it's always possible to add modifiers to the foreign collection to adjust the results. */
	modifiers: AbstractQueryModifiers;

	nesting: AbstractQueryFieldNodeNestedRelationalMany;
}

export interface AbstractQueryFieldNodeNestedUnionMany {
	type: 'nested-union-many';

	alias: string;

	/** For many, it's always possible to add modifiers to the foreign collection to adjust the results. */
	modifiers: AbstractQueryModifiers;

	nesting: AbstractQueryFieldNodeNestedRelationalAny;
}

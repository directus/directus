import type { AbstractQueryFieldNodeNestedSingleObject } from '../common/nested/object.js';
import type {
	AbstractQueryFieldNodeNestedSingleRelational,
	AbstractQueryFieldNodeNestedUnionRelational,
} from '../common/nested/relational.js';
import type { AbstractQueryFieldNode } from '../fields.js';
import type { AbstractQueryModifiers } from '../modifiers.js';

export interface AbstractQueryFieldNodeNestedSingleOne {
	type: 'nested-single-one';

	/* From the nested collection/object the user can pick primitives, apply a function or add another nested node   */
	fields: AbstractQueryFieldNode[];

	alias: string;

	nesting: AbstractQueryFieldNodeNestedSingleRelational | AbstractQueryFieldNodeNestedSingleObject;
}

export interface AbstractQueryFieldNodeNestedUnionOne {
	type: 'nested-union-one';

	alias: string;

	nesting: AbstractQueryFieldNodeNestedUnionRelational;
}

export interface AbstractQueryFieldNodeNestedSingleMany {
	type: 'nested-single-many';

	/* From the related collection the user can pick primitives, apply a function or add another nested node */
	fields: AbstractQueryFieldNode[];

	alias: string;

	/** For many, it's always possible to add modifiers to the foreign collection to adjust the results. */
	modifiers: AbstractQueryModifiers;

	nesting: AbstractQueryFieldNodeNestedSingleRelational;
}

export interface AbstractQueryFieldNodeNestedUnionMany {
	type: 'nested-union-many';

	alias: string;

	/** For many, it's always possible to add modifiers to the foreign collection to adjust the results. */
	modifiers: AbstractQueryModifiers;

	nesting: AbstractQueryFieldNodeNestedUnionRelational;
}

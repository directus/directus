import type { AbstractQueryModifiers } from '../modifiers.js';
import type { AbstractQueryFieldNode } from '../fields.js';
import type {
	AbstractQueryFieldNodeNestedRelationalMany,
	AbstractQueryFieldNodeNestedRelationalOne,
} from './nested/relational.js';

export interface AbstractQueryFieldNodeNestedOne {
	type: 'nested-one';

	/* From the related collection the user can pick primitives, apply a function or add another nested node   */
	fields: AbstractQueryFieldNode[];
	alias?: string;

	meta: AbstractQueryFieldNodeNestedRelationalOne; // AbstractQueryFieldNodeNestedObjectOne | AbstractQueryFieldNodeNestedJsonOne
}

export interface AbstractQueryFieldNodeNestedMany {
	type: 'nested-many';

	/* From the related collection the user can pick primitives, apply a function or add another nested node   */
	fields: AbstractQueryFieldNode[];
	alias?: string;

	/** For many, it's always possible to add modifiers to the foreign collection to adjust the results. */
	modifiers?: AbstractQueryModifiers;

	meta: AbstractQueryFieldNodeNestedRelationalMany; // AbstractQueryFieldNodeNestedObjectMany | AbstractQueryFieldNodeNestedJsonMany
}

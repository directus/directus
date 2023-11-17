import type { AtLeastOneElement } from '../../../misc.js';
import type { AbstractQueryFilterNode } from '../filters.js';
import type { AbstractQueryTarget } from '../target.js';
import type { AbstractQueryTargetNestedMany } from '../target/nested.js';

interface AbstractQueryReference {
	type: 'reference';

	id: number;
	target: AbstractQueryTarget;
}

export interface AbstractQueryNodeQuantifier<Target> {
	type: 'quantifier';
	operator: 'every' | 'some';

	/** A reference to this o2m target */
	reference: number;

	/** The o2m field that the every/some should be applied on */
	target: AbstractQueryTargetNestedMany;

	/** the values for the operation. */
	childNodes: AtLeastOneElement<AbstractQueryFilterNode<Target | AbstractQueryReference>>;
}

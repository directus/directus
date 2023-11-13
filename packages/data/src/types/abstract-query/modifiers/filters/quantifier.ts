export interface AbstractQueryQuantifierNode {
	type: 'quantifier';
	operator: 'every' | 'some';

	/** The o2m field that the every/some should be applied on */
	target: string;

	/** An alias to reference the o2m item */
	alias: string;

	/** the values for the the operation. */
	// childNode: AbstractQueryConditionNode | AbstractQueryNodeLogical | AbstractQueryNodeNegate;
}

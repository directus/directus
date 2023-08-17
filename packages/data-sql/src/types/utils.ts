/**
 * All nodes which can be used within the `nodes` array of the `AbstractQuery` have a type attribute.
 * With this in place it can easily be determined how to technically handle this field.
 */
export interface AbstractSqlQueryNode {
	/** the type of the node */
	type: string;
}

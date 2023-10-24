import type { ValuesNode } from '../../../parameterized-statement.js';
import type { AbstractSqlQuerySelectNode } from '../../selects/primitive.js';

/*
 * Condition to filter rows where a column value is in a list of values.
 * The value can basically be of any time, although the type should be obviously the same as the column type.
 */
export interface SqlConditionSetNode {
	type: 'condition-set';

	/* The only operator which is valid for a comparison against a set of values. */
	operation: 'in';

	/* The column in question. */
	target: AbstractSqlQuerySelectNode;

	/*
	 * Reference to the list of values to compare the column value with.
	 * The reference is a single value which in turn is a list.
	 */
	compareTo: ValuesNode;
}

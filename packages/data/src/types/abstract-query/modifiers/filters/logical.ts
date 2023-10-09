import type { AbstractQueryConditionNode } from './conditions.js';
import type { AbstractQueryNodeNegate } from './negate.js';

/**
 * Used to create logical operations.
 * @example
 * Let's say you want to only return rows where two conditions are true.
 * First condition that some field value needs to be qual to a provided value and another condition that one field is less than another provided value.
 * This would look like this:
 * ```
 * {
 * 	type: 'logical',
 * 	operator: 'and',
 * 	childNodes: [
 * 		{
 * 			type: 'condition',
 * 			condition: {...}
 * 		},
 * 		{
 * 			type: 'condition',
 * 			condition: {...}
 * 		}
 *  ]
 * }
 * ```
 * It is also possible to nest conditions with the logical operator.
 * The following pseudo code mean: A AND (B AND C)
 * ```
 * {
 * 	type: 'logical',
 * 	operator: 'and',
 * 	childNodes: [
 * 		{
 * 			type: 'condition',
 * 			condition: {...}
 * 		},
 * 		{
 * 			type: 'logical',
 * 			operator: 'and',
 * 			childNodes: [
 * 				{
 * 					type: 'condition',
 * 					condition: {...}
 * 				},
 * 				{
 * 					type: 'condition',
 * 					condition: {...}
 * 				},
 * 			],
 * 		}
 *  ]
 * }
 * ```
 */
export interface AbstractQueryNodeLogical {
	type: 'logical';
	operator: 'and' | 'or';

	/** the values for the operation. */
	childNodes: (AbstractQueryConditionNode | AbstractQueryNodeLogical | AbstractQueryNodeNegate)[];
}

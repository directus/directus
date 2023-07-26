/**
 * @param operation
 * @param negate
 * @returns
 */
export function convertNumericOperators(operation: string, negate: boolean) {
	let result = '';

	switch (operation) {
		case 'eq':
			result = `${negate ? '!=' : '='}`;
			break;
		case 'gt':
			result = `${negate ? '<=' : '>'}`;
			break;
		case 'gte':
			result = `${negate ? '<' : '>='}`;
			break;
		case 'lt':
			result = `${negate ? '>=' : '<'}`;
			break;
		case 'lte':
			result = `${negate ? '>' : '<='}`;
			break;
		default:
			throw new Error(`Unknown numeric operator: ${operation}`);
	}

	return result;
}

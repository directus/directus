/**
 * Specifies the number of items to skip before returning results
 */
export interface AbstractQueryNodeOffset {
	type: 'offset';
	value: number;
}

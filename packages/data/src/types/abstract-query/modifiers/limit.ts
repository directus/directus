/**
 * Specifies the maximum amount of returning results
 */
export interface AbstractQueryNodeLimit {
	type: 'limit';
	value: number;
}

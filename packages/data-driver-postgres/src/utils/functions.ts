/**
 * @todo Check datatype of the column. If timestamp then add "AT TIME ZONE 'UTC'" to the result string
 * @todo Probably add count support
 *
 * @param fn - The function to use
 * @param column - The column which will be used as the argument for the function
 * @returns - EXTRACT(xy FROM ...)
 */
export const extractDateTime = (fn: string, column: string): string => {
	function getFnString(fn: string) {
		return `EXTRACT(${fn} FROM ${column})`;
	}

	switch (fn) {
		case 'year':
			return getFnString('YEAR');
		case 'month':
			return getFnString('MONTH');
		case 'week':
			return getFnString('WEEK');
		case 'day':
			return getFnString('DAY');
		case 'dow':
			return getFnString('DOW');
		case 'hour':
			return getFnString('HOUR');
		case 'minute':
			return getFnString('MINUTE');
		case 'second':
			return getFnString('SECOND');
		default:
			throw new Error(`Function ${fn} is not supported.`);
	}
};

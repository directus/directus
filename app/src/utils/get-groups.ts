/**
 * Return array of formatted field groups required to fetch a data set in a given precision
 *
 * @param precision - What precision you want to group by
 * @param dateField - Field you're grouping on
 *
 * @example
 * ```js
 * getGroups('day', 'date_created');
 * // => ['year(date_created)', 'month(date_created)', 'day(date_created)']
 * ```
 */
export function getGroups(
	precision: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | undefined,
	dateField: string,
) {
	let groups: string[] = [];

	switch (precision ?? 'hour') {
		case 'year':
			groups = ['year'];
			break;
		case 'month':
			groups = ['year', 'month'];
			break;
		case 'week':
			groups = ['year', 'month', 'week'];
			break;
		case 'day':
			groups = ['year', 'month', 'day'];
			break;
		case 'hour':
			groups = ['year', 'month', 'day', 'hour'];
			break;
		case 'minute':
			groups = ['year', 'month', 'day', 'hour', 'minute'];
			break;
		case 'second':
			groups = ['year', 'month', 'day', 'hour', 'minute', 'second'];
			break;
	}

	return groups.map((datePart) => `${datePart}(${dateField})`);
}

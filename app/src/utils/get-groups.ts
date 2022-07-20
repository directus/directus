export function getGroups(precision: string, dateField: string) {
	let groups: string[] = [];

	switch (precision || 'hour') {
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
		default:
			groups = ['year', 'month', 'day', 'hour'];
			break;
	}

	return groups.map((datePart) => `${datePart}(${dateField})`);
}

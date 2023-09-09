/** Format date to be more readable */
export function getFriendlyDate(dateString: string) {
	const date = new Date(dateString);
	const year = date.getFullYear();
	const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
	const day = getDay(date.getDate());

	return `${month} ${day}, ${year}`;
}

function getDay(day: number) {
	const ordinalRules = new Intl.PluralRules('en-US', { type: 'ordinal' });

	const suffixes = new Map([
		['one', 'st'],
		['two', 'nd'],
		['few', 'rd'],
		['other', 'th'],
	]);

	const rule = ordinalRules.select(day);
	const suffix = suffixes.get(rule);

	return `${day}${suffix}`;
}

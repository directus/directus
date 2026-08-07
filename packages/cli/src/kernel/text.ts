/**
 * Format a count with the regular English singular or `s` plural used by CLI copy.
 */
export function count(n: number, noun: string): string {
	return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/** Split a comma-separated option value, dropping surrounding whitespace and empty entries. */
export function parseList(value: string): string[] {
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

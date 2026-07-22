/**
 * Format a count with the regular English singular or `s` plural used by CLI copy.
 */
export function count(n: number, noun: string): string {
	return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

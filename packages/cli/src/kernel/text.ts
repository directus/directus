export function maybePluralize(n: number, noun: string): string {
	return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

export function parseList(value: string): string[] {
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

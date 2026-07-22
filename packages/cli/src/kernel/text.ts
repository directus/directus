/**
 * Format a count with its noun, pluralizing by appending `s` for anything but one: `count(1, 'record')`
 * is `"1 record"`, `count(3, 'record')` is `"3 records"`. Deliberately naive — it exists only for the
 * CLI's own English copy, whose nouns are all regular (record, records; collection, collections; file,
 * files; change, changes), so no irregular-plural or i18n machinery is warranted.
 */
export function count(n: number, noun: string): string {
	return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

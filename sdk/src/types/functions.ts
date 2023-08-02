/**
 * Available query functions
 */
export type QueryFunctions = {
	date: 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second';
	array: 'count';
};

/**
 * Permute [function, field] combinations
 */
export type PermuteFields<Fields, Funcs> = Fields extends string
	? Funcs extends string
		? [Fields, Funcs]
		: never
	: never;

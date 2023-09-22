export type SupportedExtractFunctions = 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second';

/**
 * Used to apply a function to a specific field before returning it.
 * @example
 * There are several functions available.
 * Let's say you want to only return the year of a date field:
 * ```js
 * {
 * 	type: 'fn',
 * 	fn: 'year',
 * 	field: 'date_created'
 * }
 * ```
 */
export interface AbstractQueryFieldNodeFn {
	type: 'fn';

	fn: ExtractFn | ArrayFn;

	field: string;

	/*
	 * Those are currently not really needed but.
	 * Both, the extract functions and the count function don't allow arguments.
	 * However, this functionality is already implemented.
	 */
	args?: (string | number | boolean)[];

	alias?: string;
}

/**
 * To extract a specific part of a date/time value.
 */
export interface ExtractFn {
	type: 'extractFn';
	fn: SupportedExtractFunctions;

	/*
	 * Indicated if a column is of type TIMESTAMP.
	 * It's used to let the database parse the column properly.
	 */
	isTimestampType?: boolean;
}

export interface ArrayFn {
	type: 'arrayFn';
	fn: 'count';
}

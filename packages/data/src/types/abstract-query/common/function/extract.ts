export type SupportedExtractFunctions = 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second';

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

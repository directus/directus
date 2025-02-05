import { parse, parseISO } from 'date-fns';

/**
 * Renders a function-wrapped field as the formatted function name and translated field key
 *
 * @param value - The string value to format
 * @param type - 'dateTime' | 'date' | 'time' | 'timestamp'
 *
 * @example
 * ```js
 * parseDate('2021-09-01T12:00:00', 'dateTime');
 * // => "Wed Sep 01 2021 12:00:00 GMT+0000"
 * ```
 */
export function parseDate(value: string, type: string): Date {
	switch (type) {
		case 'dateTime':
			return parse(value, "yyyy-MM-dd'T'HH:mm:ss", new Date());
		case 'date':
			return parse(value, 'yyyy-MM-dd', new Date());
		case 'time':
			return parse(value, 'HH:mm:ss', new Date());
		case 'timestamp':
			return parseISO(value);
		default:
			return new Date(value);
	}
}

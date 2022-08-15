/**
 * Capitalizes the first character in a given string
 *
 * @param str - String to capitalize
 * @returns same string with first character capitalized
 *
 * @example
 * ```js
 * capitalizeFirst('test');
 * // => 'Test'
 * ```
 */
export function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 *
 * @param value
 * @param message
 * @throws Throws an error if an empty array or string is provided, or if value is null/undefined
 */
export const throwIfEmpty = (value: string | number | unknown[], message: string): void => {
	if (value == null || (typeof value !== 'number' && value.length === 0)) {
		throw new Error(message);
	}
};

/**
 *
 * @param value
 * @param message
 * @throws Throws an error if a nullish, empty string or empty array is provided
 */
export const throwIfEmpty = (value: string | unknown[] | null | undefined, message: string): void => {
	if (value === null || value === undefined || value.length === 0) {
		throw new Error(message);
	}
};

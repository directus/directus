
/**
 *
 * @param value
 * @param message
 * @throws Throws an error if an empty array or string is provided
 */
export const throwIfEmpty = (value: string | any[], message: string) => {
	if (value.length === 0) {
		throw new Error(message);
	}
}

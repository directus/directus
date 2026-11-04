/**
 * Guards a required parameter against missing or empty values.
 *
 * Only nullish values, empty strings and empty arrays are rejected.
 *
 * @param value
 * @param message
 * @throws Throws an error if a nullish, empty string or empty array is provided
 */
export const throwIfEmpty = (value: string | number | unknown[] | null | undefined, message: string): void => {
	if (value === null || value === undefined) {
		throw new Error(message);
	}

	if ((typeof value === 'string' || Array.isArray(value)) && value.length === 0) {
		throw new Error(message);
	}
};

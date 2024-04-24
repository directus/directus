/**
 * Result for keys with a function (e.g. `year(date_created)`):
 * - Group 1: Function (`year`)
 * - Group 3: Field (`date_created`)
 *
 * If group 3 is undefined, it is a key without a function.
 */
const FILTER_KEY_REGEX = /^([^()]+)(\(([^)]+)\))?/;

/**
 * Parses a filter key, returning its field name and function name (if defined) separately.
 */
export function parseFilterKey(key: string) {
	const match = key.match(FILTER_KEY_REGEX);

	const fieldNameWithFunction = match?.[3]?.trim();
	const fieldName = fieldNameWithFunction || key.trim();
	let functionName;

	if (fieldNameWithFunction) {
		functionName = match?.[1]?.trim();

		return { fieldName, functionName };
	}

	return { fieldName, functionName };
}

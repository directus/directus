/**
 * Strip the function declarations from a list of fields
 */
export function parseFilterKey(key: string) {
	const match = key.match(/^([^()]+)(\(([^)]+)\))?/);

	const fieldNameWithFunction = match?.[3]?.trim();
	const fieldName = fieldNameWithFunction || key.trim();
	let functionName;

	if (fieldNameWithFunction) {
		functionName = match?.[1]?.trim();

		return { fieldName, functionName };
	}

	return { fieldName, functionName };
}

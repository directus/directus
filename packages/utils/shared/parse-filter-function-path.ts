/**
 * Parse count(a.b.c) as a.b.count(c) and a.b.count(c.d) as a.b.c.count(d)
 */
export function parseFilterFunctionPath(path: string): string {
	const openParensIndex = path.indexOf('(');
	const closeParensIndex = path.indexOf(')');

	if (openParensIndex >= 0 && closeParensIndex > openParensIndex) {
		// get the function name and extract the path before it
		const functionPart = path.slice(0, openParensIndex);
		const lastSepIndex = functionPart.lastIndexOf('.');
		const functionName = functionPart.slice(lastSepIndex + 1);
		const initialColumns = functionPart.slice(0, lastSepIndex + 1);

		// extract the first argument of the function body
		const argSepIndex = path.indexOf(',');
		const argEndIndex = argSepIndex >= 0 ? Math.min(closeParensIndex, argSepIndex) : closeParensIndex;
		const argString = path.slice(openParensIndex + 1, argEndIndex).trim();
		const argRestString = path.slice(argEndIndex);

		if (argString) {
			// Extract path from the first argument only
			const argSepIndex = argString.lastIndexOf('.');
			const firstArgField = argString.slice(argSepIndex + 1);
			const relationColumns = initialColumns + argString.slice(0, argSepIndex + 1);

			// reconstruct the function path
			return `${relationColumns}${functionName}(${firstArgField}${argRestString}`;
		}
	}

	return path;
}

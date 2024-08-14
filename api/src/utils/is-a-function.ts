/**
 * Based on the patterns found in the 'uuid' and 'uuid-validate' npm packages, both of which are MIT licensed.
 */
export function valueIsAFunction(value: string): boolean {
	const regex = /(?:^)([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*(?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\s*\)/g;

	return regex.test(value);
}

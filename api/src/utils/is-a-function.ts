/**
 * Based on the patterns found in the 'uuid' and 'uuid-validate' npm packages, both of which are MIT licensed.
 */
export function valueIsAFunction(value: string): boolean {
	const regex = /\b\w+\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/g;

	return regex.test(value);
}

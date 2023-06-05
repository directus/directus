/**
 * Temporarily util until the issue following issue is fixed {@link https://github.com/brianc/node-postgres/issues/3001}
 * Because we're going to use the util function from node-postgres, there are no tests here for this function.
 * @param identifier - like a table or column name
 * @returns escaped identifier
 */
export function escapeIdentifier(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}

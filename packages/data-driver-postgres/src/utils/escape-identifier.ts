/**
 * Temporarily until the issue with importing the corresponding function from node-postgres {@link https://github.com/brianc/node-postgres/issues/2986#issuecomment-1570217254}
 *
 * @param identifier - like a table or column name
 * @returns escaped identifier
 */
export function escapeIdentifier(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}

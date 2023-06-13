/**
 * Escapes an identifier to protect against SQL injection.
 * @param identifier - like a table or column name
 * @returns escaped identifier
 */
export function escapeIdentifier(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}

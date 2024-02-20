/**
 * Used to convert a JSON target across all condition nodes
 *
 * @param targetNode - any target node
 * @param target the table and column index combination
 * @returns the json props appended to the target using the arrow syntax if a json node was given
 */
export function applyIntegerCast(statementPart: string): string {
	return `CAST(${statementPart} AS INTEGER)`;
}

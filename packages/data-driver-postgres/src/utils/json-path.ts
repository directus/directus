import type { AtLeastOneElement } from '@directus/data';

/**
 * Used to convert a JSON target across all condition nodes
 *
 * @param targetNode - any target node
 * @param target the table and column index combination
 * @returns the json props appended to the target using the arrow syntax if a json node was given
 */
export function applyJsonPathAsString(wrappedColumn: string, path: AtLeastOneElement<number>): string {
	const jsonPathWithoutLast = path
		.slice(0, -1)
		.map((p) => ` -> $${p + 1}`)
		.join('');

	const jsonPathLast = ` ->> $${path.at(-1)! + 1}`;

	return `${wrappedColumn}${jsonPathWithoutLast}${jsonPathLast}`;
}

export function applyJsonPathAsNumber(wrappedColumn: string, path: AtLeastOneElement<number>): string {
	const jsonPath = applyJsonPathAsString(wrappedColumn, path);
	return `CAST(${jsonPath} AS INTEGER)`;
}

export function applyJsonPathAsObject(wrappedColumn: string, path: AtLeastOneElement<number>): string {
	const jsonPath = path.map((p) => ` -> $${p + 1}`).join('');
	return `${wrappedColumn}${jsonPath}`;
}

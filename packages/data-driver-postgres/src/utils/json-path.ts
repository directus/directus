import type { AtLeastOneElement } from '@directus/data';

export function applyJsonPathAsObject(wrappedColumn: string, path: AtLeastOneElement<number>): string {
	const jsonPath = path.map((p) => ` -> $${p + 1}`).join('');

	return `${wrappedColumn}${jsonPath}`;
}

export function applyJsonPathAsString(wrappedColumn: string, path: AtLeastOneElement<number>): string {
	const jsonPathWithoutLast = path
		.slice(0, -1)
		.map((p) => ` -> $${p + 1}`)
		.join('');

	const jsonPathLast = ` ->> $${path.at(-1)! + 1}`;

	return `${wrappedColumn}${jsonPathWithoutLast}${jsonPathLast}`;
}

export function applyJsonPathAsNumber(wrappedColumn: string, path: AtLeastOneElement<number>): string {
	const jsonPath = applyJsonPathAsObject(wrappedColumn, path);

	return `CAST(${jsonPath} AS numeric)`;
}

export function applyJsonPathAsGeometry(wrappedColumn: string, path: AtLeastOneElement<number>): string {
	const jsonPath = applyJsonPathAsString(wrappedColumn, path);

	return `CAST(${jsonPath} AS geometry)`;
}

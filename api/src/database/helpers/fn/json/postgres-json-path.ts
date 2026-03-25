import { toPath } from 'lodash-es';

/**
 * Build a parameterized PostgreSQL JSON path using -> operators.
 * Returns a template string containing only operators and ? placeholders,
 * plus a bindings array with the actual values.
 *
 * When forFilter is true, the final step uses ->> to return text instead of json,
 * which is required for WHERE clause comparisons (LIKE, =, etc.).
 *
 * @example ".color" → { template: "->?", bindings: ["color"] }
 * @example ".color" (forFilter) → { template: "->>?", bindings: ["color"] }
 * @example ".items[0].name" → { template: "->?->?->?", bindings: ["items", 0, "name"] }
 * @example ".items[0].name" (forFilter) → { template: "->?->?->>?", bindings: ["items", 0, "name"] }
 */
export function buildPostgresJsonPath(
	path: string,
	forFilter?: boolean,
): { template: string; bindings: (string | number)[] } {
	const parts = toPath(path.startsWith('.') ? path.slice(1) : path);

	let template = '';
	const bindings: (string | number)[] = [];

	for (let i = 0; i < parts.length; i++) {
		const num = Number(parts[i]);
		const isLast = i === parts.length - 1;
		const isInt = !isNaN(num) && num >= 0 && Number.isInteger(num);

		if (isInt) {
			// Integer array indices must be inlined as SQL literals, not passed as bind
			// parameters. The pg driver sends JS numbers with an ambiguous type, causing
			// PostgreSQL to pick the jsonb->text overload instead of jsonb->integer,
			// which returns NULL when applied to an array.
			template += forFilter && isLast ? `->>${num}` : `->${num}`;
		} else {
			template += forFilter && isLast ? '->>?' : '->?';
			bindings.push(parts[i]!);
		}
	}

	return { template, bindings };
}

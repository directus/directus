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
	forFilter?: boolean, // QUESTION Can we do this differently?
): { template: string; bindings: (string | number)[] } {
	const parts = toPath(path.startsWith('.') ? path.slice(1) : path);

	let template = '';
	const bindings: (string | number)[] = [];

	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i]!;

		if (isArrayIndex(part)) {
			// Integer array indices must be inlined as SQL literals, not passed as bind
			// parameters: the pg driver sends JS numbers without a type hint, causing
			// PostgreSQL to pick the jsonb->text overload instead of jsonb->integer,
			// which returns NULL when applied to an array element.
			// Injection safety: isArrayIndex (below) guarantees `part` is a non-negative
			// integer string ("0", "5", "123") — it will never contain SQL-dangerous characters.
			template += `->${part}`;
		} else {
			template += '->?';
			bindings.push(part);
		}
	}

	// handle final part here
	const part = parts[parts.length - 1]!;
	const operator = forFilter ? '->>' : '->';

	if (isArrayIndex(part)) {
		// Same as above: isArrayIndex guarantees a non-negative integer literal, safe to inline.
		template += operator + part;
	} else {
		template += operator + '?';
		bindings.push(part);
	}

	return { template, bindings };
}

/**
 * Checks if a provided value is a valid positive number for array access
 */
function isArrayIndex(value: unknown): boolean {
	if (typeof value === 'number') {
		return value >= 0 && Number.isInteger(value);
	}

	if (typeof value === 'string') {
		const num = Number(value);
		return String(num) === value && num >= 0 && Number.isInteger(num);
	}

	return false;
}

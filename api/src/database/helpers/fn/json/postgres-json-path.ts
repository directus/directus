import { toPath } from 'lodash-es';

/**
 * Build a parameterized PostgreSQL JSON path using -> operators.
 * Returns a template string containing only operators and ? placeholders,
 * plus a bindings array with the actual values.
 *
 * When asText is true, the final step uses ->> to return text instead of json,
 * which is required for WHERE clause comparisons (LIKE, =, etc.) and ORDER BY.
 *
 * @example ".color" → { template: "->?", bindings: ["color"] }
 * @example ".color" (asText) → { template: "->>?", bindings: ["color"] }
 * @example ".items[0].name" → { template: "->?->?->?", bindings: ["items", 0, "name"] }
 * @example ".items[0].name" (asText) → { template: "->?->?->>?", bindings: ["items", 0, "name"] }
 */
export function buildPostgresJsonPath(
	path: string,
	options?: { asText?: boolean },
): { template: string; bindings: (string | number)[] } {
	const parts = toPath(path);

	let template = '';
	const bindings: (string | number)[] = [];

	// Index of the final non-empty segment, which takes the asText operator (->>).
	let lastIndex = parts.length - 1;
	while (lastIndex >= 0 && parts[lastIndex] === '') lastIndex--;

	for (let i = 0; i <= lastIndex; i++) {
		const part = parts[i]!;

		// Drop empty segments left behind by incomplete paths (leading/trailing/repeated dots),
		// consistent with convertToJsonPath used by the other dialects.
		if (part === '') continue;

		const operator = i === lastIndex && options?.asText ? '->>' : '->';

		if (isArrayIndex(part)) {
			// Integer array indices must be inlined as SQL literals, not passed as bind
			// parameters: the pg driver sends JS numbers without a type hint, causing
			// PostgreSQL to pick the jsonb->text overload instead of jsonb->integer,
			// which returns NULL when applied to an array element.
			// Injection safety: isArrayIndex (below) guarantees `part` is a non-negative
			// integer string ("0", "5", "123") — it will never contain SQL-dangerous characters.
			template += operator + part;
		} else {
			template += operator + '?';
			bindings.push(part);
		}
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

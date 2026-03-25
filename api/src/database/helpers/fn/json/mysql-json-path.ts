import { toPath } from 'lodash-es';

/**
 * Build a MySQL/MariaDB JSON path string using dot notation.
 *
 * @example ".color" → "$.color"
 * @example ".items[0].name" → "$.items[0].name"
 */
export function convertToMySQLPath(path: string): string {
	// Use dot notation for object keys (compatible with both MySQL and MariaDB)
	// ".color" → "$.color"
	// ".items[0].name" → "$.items[0].name"
	const parts = toPath(path.startsWith('.') ? path.slice(1) : path);

	let result = '$';

	for (const part of parts) {
		const num = Number(part);

		if (Number.isInteger(num) && num >= 0 && String(num) === part) {
			result += `[${part}]`;
		} else {
			result += `.${part}`;
		}
	}

	return result;
}

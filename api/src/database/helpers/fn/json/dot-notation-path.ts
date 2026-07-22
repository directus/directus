import { toPath } from 'lodash-es';

/**
 * Build a JSON path string in dot notation (`$.a.b[0]`) shared by the dialects that
 * accept it: SQLite (`json_extract`), MySQL/MariaDB (`JSON_EXTRACT`), MSSQL
 * (`JSON_VALUE`/`JSON_QUERY`), and Oracle (`JSON_VALUE`/`JSON_QUERY`).
 *
 * @example ".color" → "$.color"
 * @example ".items[0].name" → "$.items[0].name"
 * @example ".author." → "$.author"
 * @example "a[.b]" → "$.a.b"
 */
export function convertToJsonPath(path: string): string {
	const parts = toPath(path.startsWith('.') ? path.slice(1) : path);

	let result = '$';

	for (const part of parts) {
		// Drop empty segments left behind by incomplete paths (trailing/repeated dots).
		if (part === '') continue;

		const num = Number(part);

		if (Number.isInteger(num) && num >= 0 && String(num) === part) {
			result += `[${part}]`;
		} else {
			result += `.${part}`;
		}
	}

	return result;
}

/**
 * Build a SQLite JSON path string for use with `json_extract`.
 *
 * Empty dot segments are dropped so incomplete paths such as ".author." remain valid.
 *
 * @example ".color" → "$.color"
 * @example ".items[0].name" → "$.items[0].name"
 * @example ".author." → "$.author"
 * @example "." → "$"
 */
export function convertToSQLitePath(path: string): string {
	let result = '$';
	let property = '';

	const appendProperty = () => {
		if (!property) return;

		result += `.${property}`;
		property = '';
	};

	for (let index = path.startsWith('.') ? 1 : 0; index < path.length; index++) {
		const character = path[index]!;

		if (character === '.') {
			appendProperty();
			continue;
		}

		if (character === '[') {
			appendProperty();

			const endIndex = path.indexOf(']', index);

			if (endIndex === -1) break;

			const segment = path.slice(index + 1, endIndex);

			if (/^\d+$/.test(segment)) {
				result += `[${segment}]`;
			} else if (segment) {
				result += `.${segment}`;
			}

			index = endIndex;
			continue;
		}

		property += character;
	}

	appendProperty();

	return result;
}

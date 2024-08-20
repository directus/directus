import { isString } from 'lodash-es';
import type { Sql } from '../types.js';

export type PreprocessBindingsOptions = {
	format(index: number): string;
};

export function preprocessBindings(
	queryParams: (Partial<Sql> & Pick<Sql, 'sql'>) | string,
	options: PreprocessBindingsOptions,
) {
	const query: Sql = { bindings: [], ...(isString(queryParams) ? { sql: queryParams } : queryParams) };

	const bindingIndices: number[] = new Array(query.bindings.length);

	for (let i = 0; i < query.bindings.length; i++) {
		const binding = query.bindings[i];
		const prevIndex = query.bindings.findIndex((b, j) => j < i && b === binding);

		if (prevIndex !== -1) {
			bindingIndices[i] = prevIndex;
		} else {
			bindingIndices[i] = i;
		}
	}

	let matchIndex = 0;
	let currentBindingIndex = 0;

	const sql = query.sql.replace(/(\\*)(\?)/g, function (_, escapes) {
		if (escapes.length % 2) {
			// Return an escaped question mark, so it stays escaped
			return `${'\\'.repeat(escapes.length)}?`;
		} else {
			const bindingIndex =
				bindingIndices[matchIndex] === matchIndex ? currentBindingIndex++ : bindingIndices[matchIndex]!;

			matchIndex++;
			return options.format(bindingIndex);
		}
	});

	const bindings = query.bindings.filter((_, i) => bindingIndices[i] === i);

	return { ...query, sql, bindings };
}

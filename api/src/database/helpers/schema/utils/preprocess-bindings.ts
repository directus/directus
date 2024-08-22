import { isString } from 'lodash-es';
import type { Sql } from '../types.js';
import type { Knex } from 'knex';

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
	const bindings: Knex.Value[] = [];

	const sql = query.sql.replace(/(\\*)(\?)/g, function (_, escapes) {
		if (escapes.length % 2) {
			// Return an escaped question mark, so it stays escaped
			return `${'\\'.repeat(escapes.length)}?`;
		} else {
			let bindingIndex;

			if (bindingIndices[matchIndex] === matchIndex) {
				bindingIndex = currentBindingIndex++;
				bindingIndices[matchIndex] = bindingIndex;
				bindings.push(query.bindings[matchIndex]!);
			} else {
				bindingIndex = bindingIndices[bindingIndices[matchIndex]!]!;
			}

			matchIndex++;
			return options.format(bindingIndex);
		}
	});

	return { ...query, sql, bindings };
}

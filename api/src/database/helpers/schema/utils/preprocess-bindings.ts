import { isString } from 'lodash-es';
import type { Knex } from 'knex';
import type { Sql } from '../types.js';

export type PreprocessBindingsOptions = {
	format(index: number): string;
};

/**
 * Preprocess a SQL query, such that repeated binding values are bound to the same binding index.
 **/
export function preprocessBindings(
	queryParams: (Partial<Sql> & Pick<Sql, 'sql'>) | string,
	options: PreprocessBindingsOptions,
) {
	const query: Sql = { bindings: [], ...(isString(queryParams) ? { sql: queryParams } : queryParams) };

	// bindingIndices[i] is the index of the first occurrence of query.bindings[i]
	const bindingIndices: number[] = new Array(query.bindings.length);

	for (let i = 0; i < query.bindings.length; i++) {
		const binding = query.bindings[i];
		const prevIndex = query.bindings.findIndex((b, j) => j < i && b === binding);

		if (prevIndex === -1) {
			// The first time the value is encountered, set the index lookup to the current index
			bindingIndices[i] = i;
		} else {
			// The value has been encountered before, set the index lookup to the first occurrence index
			bindingIndices[i] = prevIndex;
		}
	}

	let matchIndex = 0;
	let nextBindingIndex = 0;
	// The new, deduplicated bindings
	const bindings: Knex.Value[] = [];

	const sql = query.sql.replace(/(\\*)(\?)/g, function (_, escapes) {
		if (escapes.length % 2) {
			// Return an escaped question mark, so it stays escaped
			return `${'\\'.repeat(escapes.length)}?`;
		} else {
			let bindingIndex;

			if (bindingIndices[matchIndex] === matchIndex) {
				// This is the first occurrence of this binding in the SQL string, as the index
				// of its first occurrence (bindingIndices[matchIndex]) is the same as the current index (matchIndex).

				// Use the nextBindingIndex to get the next unused binding index that is used in the new, deduplicated bindings
				bindingIndex = nextBindingIndex++;

				// Update the lookup table to point to the new binding index
				bindingIndices[matchIndex] = bindingIndex;

				// Add the binding value to the new bindings
				bindings.push(query.bindings[matchIndex]!);
			} else {
				// This index belongs to a binding that has been encountered before.
				// Do a double lookup, first look up the original, first occurrence index of the binding value and then
				// use that index to look up the newly assigned index used in the deduplicated bindings.
				bindingIndex = bindingIndices[bindingIndices[matchIndex]!]!;
			}

			// Increment the loop counter
			matchIndex++;
			return options.format(bindingIndex);
		}
	});

	return { ...query, sql, bindings };
}

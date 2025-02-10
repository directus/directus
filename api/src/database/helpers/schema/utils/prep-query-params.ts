import { isString } from 'lodash-es';
import type { Knex } from 'knex';
import type { Sql } from '../types.js';

export type PrepQueryParamsOptions = {
	format(index: number): string;
};

/**
 * Preprocess a SQL query, such that repeated binding values are bound to the same binding index.
 **/
export function prepQueryParams(
	queryParams: (Partial<Sql> & Pick<Sql, 'sql'>) | string,
	options: PrepQueryParamsOptions,
	deduplicate_uuids: boolean = true,
) {
	const query: Sql = { bindings: [], ...(isString(queryParams) ? { sql: queryParams } : queryParams) };

	// bindingIndices[i] is the index of the first occurrence of query.bindings[i]
	const bindingIndices = new Map<Knex.Value, number>();

	// The new, deduplicated bindings
	const bindings: Knex.Value[] = [];

	// Regular expression to match UUIDs
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

	let matchIndex = 0;
	let nextBindingIndex = 0;

	const sql = query.sql.replace(/(\\*)(\?)/g, (_, escapes) => {
		if (escapes.length % 2) {
			// Return an escaped question mark, so it stays escaped
			return `${'\\'.repeat(escapes.length)}?`;
		}

		const binding = query.bindings[matchIndex]!;
		let bindingIndex: number;

		const isUuid = typeof binding === 'string' && uuidRegex.test(binding);

		// If deduplicate_uuids is false and the binding is a UUID, do not deduplicate it
		if (deduplicate_uuids === false && isUuid) {
			bindingIndex = nextBindingIndex++;
			bindings.push(binding);
		} else if (bindingIndices.has(binding)) {
			// This index belongs to a binding that has been encountered before.
			bindingIndex = bindingIndices.get(binding)!;
		} else {
			// The first time the value is encountered, set the index lookup to the current index
			// Use the nextBindingIndex to get the next unused binding index that is used in the new, deduplicated bindings
			bindingIndex = nextBindingIndex++;
			bindingIndices.set(binding, bindingIndex);
			bindings.push(binding);
		}

		// Increment the loop counter
		matchIndex++;
		return options.format(bindingIndex);
	});

	return { ...query, sql, bindings };
}

/**
 * Generate an AST based on a given collection and query
 */

import type { Accountability, Query, SchemaOverview } from '@directus/types';
import { cloneDeep, uniq } from 'lodash-es';
import type { AST } from '../../types/index.js';
import { parseFields } from './lib/parse-fields.js';

export async function getAstFromQuery(
	collection: string,
	query: Query,
	schema: SchemaOverview,
	accountability: Accountability | null,
): Promise<AST> {
	query = cloneDeep(query);

	const ast: AST = {
		type: 'root',
		name: collection,
		query: query,
		children: [],
		cases: [],
	};

	let fields = ['*'];

	if (query.fields) {
		fields = query.fields;
	}

	/**
	 * When using aggregate functions, you can't have any other regular fields
	 * selected. This makes sure you never end up in a non-aggregate fields selection error
	 */
	if (Object.keys(query.aggregate || {}).length > 0) {
		fields = [];
	}

	/**
	 * Similarly, when grouping on a specific field, you can't have other non-aggregated fields.
	 * The group query will override the fields query
	 */
	if (query.group) {
		fields = query.group;
	}

	fields = uniq(fields);

	const deep = query.deep || {};

	// Prevent fields/deep from showing up in the query object in further use
	delete query.fields;
	delete query.deep;

	if (!query.sort) {
		// We'll default to the primary key for the standard sort output
		let sortField = schema.collections[collection]!.primary;

		// If a custom manual sort field is configured, use that
		if (schema.collections[collection]?.sortField) {
			sortField = schema.collections[collection]!.sortField as string;
		}

		// When group by is used, default to the first column provided in the group by clause
		if (query.group?.[0]) {
			sortField = query.group[0];
		}

		query.sort = [sortField];
	}

	// When no group by is supplied, but an aggregate function is used, only a single row will be
	// returned. In those cases, we'll ignore the sort field altogether
	if (query.aggregate && Object.keys(query.aggregate).length && !query.group?.[0]) {
		delete query.sort;
	}

	ast.children = await parseFields(schema, collection, fields, query, accountability, deep);

	return ast;
}

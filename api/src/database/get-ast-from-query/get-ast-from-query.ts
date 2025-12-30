/**
 * Generate an AST based on a given collection and query
 */

import { parseFields } from './lib/parse-fields.js';
import { getAllowedSort } from './utils/get-allowed-sort.js';
import type { AST } from '../../types/index.js';
import type { Accountability, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { cloneDeep, uniq } from 'lodash-es';

export interface GetAstFromQueryOptions {
	collection: string;
	query: Query;
	accountability: Accountability | null;
}

export interface GetAstFromQueryContext {
	knex: Knex;
	schema: SchemaOverview;
}

export async function getAstFromQuery(options: GetAstFromQueryOptions, context: GetAstFromQueryContext): Promise<AST> {
	options.query = cloneDeep(options.query);

	const ast: AST = {
		type: 'root',
		name: options.collection,
		query: options.query,
		children: [],
		cases: [],
	};

	let fields = ['*'];

	if (options.query.fields) {
		fields = options.query.fields;
	}

	/**
	 * When using aggregate functions, you can't have any other regular fields
	 * selected. This makes sure you never end up in a non-aggregate fields selection error
	 */
	if (Object.keys(options.query.aggregate || {}).length > 0) {
		fields = [];
	}

	/**
	 * Similarly, when grouping on a specific field, you can't have other non-aggregated fields.
	 * The group query will override the fields query
	 */
	if (options.query.group) {
		fields = options.query.group;
	}

	fields = uniq(fields);

	const deep = options.query.deep || {};

	// Prevent fields/deep from showing up in the query object in further use
	delete options.query.fields;
	delete options.query.deep;

	options.query.sort ??= await getAllowedSort(options, context);

	// When no group by is supplied, but an aggregate function is used, only a single row will be
	// returned. In those cases, we'll ignore the sort field altogether
	if (options.query.aggregate && Object.keys(options.query.aggregate).length && !options.query.group?.[0]) {
		delete options.query.sort;
	}

	ast.children = await parseFields(
		{
			parentCollection: options.collection,
			fields,
			query: options.query,
			deep,
			accountability: options.accountability,
		},
		context,
	);

	return ast;
}

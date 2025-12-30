import type { AliasMap } from '../../../utils/get-column-path.js';
import { applyFilter } from '../lib/apply-query/filter/index.js';
import type { Filter, Permission, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';

export interface ApplyCaseWhenOptions {
	column: Knex.Raw;
	columnCases: Filter[];
	table: string;
	cases: Filter[];
	aliasMap: AliasMap;
	alias?: string;
	permissions: Permission[];
}

export interface ApplyCaseWhenContext {
	knex: Knex;
	schema: SchemaOverview;
}

export function applyCaseWhen(
	{ columnCases, table, aliasMap, cases, column, alias, permissions }: ApplyCaseWhenOptions,
	{ knex, schema }: ApplyCaseWhenContext,
): Knex.Raw {
	const caseQuery = knex.queryBuilder();

	applyFilter(knex, schema, caseQuery, { _or: columnCases }, table, aliasMap, cases, permissions);

	const compiler = knex.client.queryCompiler(caseQuery);

	const sqlParts = [];

	// Only empty filters, so no where was generated, skip it
	if (!compiler.grouped.where) return column;

	for (const statement of compiler.grouped.where) {
		const val = compiler[statement.type](statement);

		if (val) {
			if (sqlParts.length > 0) {
				sqlParts.push(statement.bool);
			}

			sqlParts.push(val);
		}
	}

	const sql = sqlParts.length > 0 ? sqlParts.join(' ') : '1';
	const bindings = [...caseQuery.toSQL().bindings, column];

	let rawCase = `(CASE WHEN ${sql} THEN ?? END)`;

	if (alias) {
		rawCase += ' AS ??';
		bindings.push(alias);
	}

	return knex.raw(rawCase, bindings);
}

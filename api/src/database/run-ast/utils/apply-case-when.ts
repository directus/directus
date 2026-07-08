import type { Filter, Permission, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { AliasMap } from '../../../utils/get-column-path.js';
import { applyFilter } from '../lib/apply-query/filter/index.js';

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

	// The filter had conditions but none compiled to SQL, so the rule is invalid (eg. it references
	// fields or relations that no longer exist). Deny rather than grant unconditional access: gate the
	// column behind an always-false condition so the field is hidden. Must be a real boolean expression,
	// since eg. PostgreSQL rejects a plain integer as a CASE/WHEN condition.
	const sql = sqlParts.length > 0 ? sqlParts.join(' ') : '1 = 0';
	const bindings = [...caseQuery.toSQL().bindings, column];

	let rawCase = `(CASE WHEN ${sql} THEN ?? END)`;

	if (alias) {
		rawCase += ' AS ??';
		bindings.push(alias);
	}

	return knex.raw(rawCase, bindings);
}
